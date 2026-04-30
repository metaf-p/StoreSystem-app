import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { History, Loader2, MessageSquare, Plus, Send, UserPlus, Users } from "lucide-react";
import { addUserToChat, createChat as createChatRequest, getChat, getUserDisplayName, listChatMessages, listChats } from "../api/chat";
import { listUsers } from "../api/auth";
import { CHAT_WS_URL } from "../config";
import { getErrorMessage } from "../lib/http";
import { cn } from "../lib/utils";
import { useAuth } from "../state/AuthContext";
import type { AdminUser, Chat, ChatCreatePayload, ChatMessage, UserNameCache } from "../types";
import { Button } from "../ui/Button";
import { Checkbox } from "../ui/Checkbox";
import { Input } from "../ui/Input";
import { Modal } from "../ui/Modal";
import { RoleGuard } from "../ui/RoleGuard";
import { useToast } from "../ui/Toast";

type ChatMessageView = ChatMessage & {
  senderName: string;
};

const MESSAGE_MAX_LENGTH = 1000;

export function ChatPage() {
  const { accessToken, authorizedFetch, refreshAccessToken, user } = useAuth();
  const toast = useToast();

  const [chats, setChats] = useState<Chat[]>([]);
  const [chatsLoading, setChatsLoading] = useState(true);
  const [chatsError, setChatsError] = useState("");
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageView[]>([]);
  const [messageDraft, setMessageDraft] = useState("");
  const [socketReady, setSocketReady] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createIsGroup, setCreateIsGroup] = useState(false);
  const [createParticipantIds, setCreateParticipantIds] = useState<string[]>([]);
  const [participantUsers, setParticipantUsers] = useState<AdminUser[]>([]);
  const [participantUsersLoading, setParticipantUsersLoading] = useState(false);
  const [participantUsersError, setParticipantUsersError] = useState("");
  const [addModalChatId, setAddModalChatId] = useState<string | null>(null);
  const [addModalChat, setAddModalChat] = useState<Chat | null>(null);
  const [addParticipantIds, setAddParticipantIds] = useState<string[]>([]);
  const [addSubmitting, setAddSubmitting] = useState(false);

  const socketRef = useRef<WebSocket | null>(null);
  const socketGenerationRef = useRef(0);
  const historyRequestRef = useRef(0);
  const messageListEndRef = useRef<HTMLDivElement | null>(null);
  const userNameCacheRef = useRef<UserNameCache>({});

  const currentUserId = user?.id || "";
  const currentChat = useMemo(
    () => chats.find((chat) => chat.id === selectedChatId) || null,
    [chats, selectedChatId],
  );
  const createSelectableUsers = useMemo(
    () => participantUsers.filter((entry) => entry.id !== currentUserId),
    [currentUserId, participantUsers],
  );
  const addSelectableUsers = useMemo(() => {
    if (!addModalChat) {
      return participantUsers;
    }

    const existingParticipants = new Set(addModalChat.participants);
    return participantUsers.filter((entry) => !existingParticipants.has(entry.id));
  }, [addModalChat, participantUsers]);

  const loadChats = useCallback(async () => {
    setChatsLoading(true);
    setChatsError("");

    try {
      const nextChats = await listChats(authorizedFetch);
      setChats(nextChats);
      return nextChats;
    } catch (error) {
      const message = getErrorMessage(error);
      setChats([]);
      setChatsError(message);
      toast.danger(message);
      return [];
    } finally {
      setChatsLoading(false);
    }
  }, [authorizedFetch, toast]);

  const loadParticipantUsers = useCallback(async () => {
    setParticipantUsersLoading(true);
    setParticipantUsersError("");

    try {
      const response = await listUsers(authorizedFetch, {
        pageSize: 100,
        sortBy: "name",
        order: "asc",
      });
      setParticipantUsers(response.users);
      return response.users;
    } catch (error) {
      const message = getErrorMessage(error);
      setParticipantUsers([]);
      setParticipantUsersError(message);
      toast.danger(message);
      return [];
    } finally {
      setParticipantUsersLoading(false);
    }
  }, [authorizedFetch, toast]);

  const closeSocket = useCallback(() => {
    const socket = socketRef.current;
    if (!socket) {
      return;
    }

    socket.onopen = null;
    socket.onmessage = null;
    socket.onerror = null;
    socket.onclose = null;
    socket.close();
    socketRef.current = null;
  }, []);

  const resolveSenderName = useCallback(
    async (senderId: string) => {
      if (senderId === currentUserId) {
        return "Вы";
      }

      const cached = userNameCacheRef.current[senderId];
      if (cached) {
        return cached;
      }

      try {
        const response = await getUserDisplayName(authorizedFetch, senderId);
        const resolvedName = response.name || senderId;
        userNameCacheRef.current[senderId] = resolvedName;
        return resolvedName;
      } catch {
        userNameCacheRef.current[senderId] = senderId;
        return senderId;
      }
    },
    [authorizedFetch, currentUserId],
  );

  const appendIncomingMessage = useCallback(
    (message: ChatMessage) => {
      const isOwnMessage = message.sender_id === currentUserId;
      const fallbackName = isOwnMessage ? "Вы" : userNameCacheRef.current[message.sender_id] || `User ${message.sender_id}`;

      setMessages((currentMessages) => [...currentMessages, { ...message, senderName: fallbackName }]);

      if (!isOwnMessage && !userNameCacheRef.current[message.sender_id]) {
        void resolveSenderName(message.sender_id).then((resolvedName) => {
          setMessages((currentMessages) =>
            currentMessages.map((entry) => (entry.id === message.id ? { ...entry, senderName: resolvedName } : entry)),
          );
        });
      }
    },
    [currentUserId, resolveSenderName],
  );

  const handleSocketMessage = useCallback(
    (data: string) => {
      try {
        const parsed = JSON.parse(data) as Partial<ChatMessage & { error?: string }>;
        if (typeof parsed.error === "string" && parsed.error.trim()) {
          toast.danger(parsed.error.trim());
          return;
        }

        if (!parsed.id || !parsed.chat_id || !parsed.sender_id || typeof parsed.content !== "string" || !parsed.created_at) {
          return;
        }

        appendIncomingMessage({
          id: parsed.id,
          chat_id: parsed.chat_id,
          sender_id: parsed.sender_id,
          content: parsed.content,
          created_at: parsed.created_at,
        });
      } catch {
        toast.danger("Ошибка получения сообщения.");
      }
    },
    [appendIncomingMessage, toast],
  );

  const openCreateModal = useCallback(() => {
    setCreateName("");
    setCreateIsGroup(false);
    setCreateParticipantIds([]);
    setParticipantUsersError("");
    setCreateModalOpen(true);
    void loadParticipantUsers();
  }, [loadParticipantUsers]);

  const closeCreateModal = useCallback(() => {
    setCreateModalOpen(false);
    setCreateSubmitting(false);
    setCreateName("");
    setCreateIsGroup(false);
    setCreateParticipantIds([]);
    setParticipantUsersError("");
  }, []);

  const openAddParticipantsModal = useCallback(
    async (chatId: string) => {
      setAddModalChatId(chatId);
      setAddModalChat(null);
      setAddParticipantIds([]);
      setAddSubmitting(false);
      setParticipantUsersError("");

      try {
        const [chat] = await Promise.all([getChat(authorizedFetch, chatId), loadParticipantUsers()]);
        setAddModalChat(chat);
      } catch (error) {
        const message = getErrorMessage(error);
        toast.danger(message);
        setAddModalChatId(null);
        setAddModalChat(null);
      }
    },
    [authorizedFetch, loadParticipantUsers, toast],
  );

  const closeAddParticipantsModal = useCallback(() => {
    setAddModalChatId(null);
    setAddModalChat(null);
    setAddParticipantIds([]);
    setAddSubmitting(false);
    setParticipantUsersError("");
  }, []);

  const handleSelectChat = useCallback((chatId: string) => {
    setSelectedChatId(chatId);
    setMessageDraft("");
    setHistoryError("");
    setMessages([]);
    setSocketReady(false);
  }, []);

  const handleLoadHistory = useCallback(async () => {
    if (!selectedChatId) {
      return;
    }

    const requestId = historyRequestRef.current + 1;
    historyRequestRef.current = requestId;
    setHistoryLoading(true);
    setHistoryError("");

    try {
      const history = await listChatMessages(authorizedFetch, selectedChatId);
      if (historyRequestRef.current !== requestId) {
        return;
      }

      const resolvedMessages = await Promise.all(
        history.map(async (message) => ({
          ...message,
          senderName: await resolveSenderName(message.sender_id),
        })),
      );

      if (historyRequestRef.current !== requestId) {
        return;
      }

      setMessages(resolvedMessages);
    } catch (error) {
      if (historyRequestRef.current !== requestId) {
        return;
      }

      const message = getErrorMessage(error);
      setHistoryError(message);
      toast.danger(message);
    } finally {
      if (historyRequestRef.current === requestId) {
        setHistoryLoading(false);
      }
    }
  }, [authorizedFetch, resolveSenderName, selectedChatId, toast]);

  const handleSendMessage = useCallback(
    (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();

      const text = messageDraft.trim();
      if (!text) {
        toast.danger("Введите сообщение.");
        return;
      }

      if (text.length > MESSAGE_MAX_LENGTH) {
        toast.danger("Сообщение не должно превышать 1000 символов.");
        return;
      }

      const socket = socketRef.current;
      if (!socket || socket.readyState !== WebSocket.OPEN) {
        toast.danger("Подключение к чату ещё не готово");
        return;
      }

      socket.send(JSON.stringify({ content: text }));
      setMessageDraft("");
    },
    [messageDraft, toast],
  );

  const handleCreateChat = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!user?.id) {
        return;
      }

      const name = createName.trim();
      if (!name) {
        toast.danger("Введите название чата.");
        return;
      }

      const participants = Array.from(new Set([user.id, ...createParticipantIds]));
      if (participants.length < 2) {
        toast.danger("Выберите хотя бы одного участника.");
        return;
      }

      const payload: ChatCreatePayload = {
        name,
        is_group: createIsGroup,
        participants,
      };

      setCreateSubmitting(true);
      try {
        const newChat = await createChatRequest(authorizedFetch, payload);
        toast.success("Чат успешно создан");
        closeCreateModal();
        const nextChats = await loadChats();
        const createdChatExists = nextChats.some((chat) => chat.id === newChat.id);
        if (!createdChatExists) {
          setChats((currentChats) => [newChat, ...currentChats]);
        }
        setSelectedChatId(newChat.id);
      } catch (error) {
        toast.danger(getErrorMessage(error));
      } finally {
        setCreateSubmitting(false);
      }
    },
    [authorizedFetch, closeCreateModal, createIsGroup, createName, createParticipantIds, loadChats, toast, user?.id],
  );

  const handleAddParticipants = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!addModalChat) {
        return;
      }

      const participantsToAdd = Array.from(new Set(addParticipantIds)).filter(
        (participantId) => !addModalChat.participants.includes(participantId),
      );

      if (participantsToAdd.length === 0) {
        toast.danger("Выберите хотя бы одного участника.");
        return;
      }

      setAddSubmitting(true);
      try {
        for (const participantId of participantsToAdd) {
          await addUserToChat(authorizedFetch, addModalChat.id, participantId);
        }

        toast.success("Участники добавлены в чат");
        closeAddParticipantsModal();
        await loadChats();
      } catch (error) {
        toast.danger(getErrorMessage(error));
      } finally {
        setAddSubmitting(false);
      }
    },
    [addModalChat, addParticipantIds, authorizedFetch, closeAddParticipantsModal, loadChats, toast],
  );

  useEffect(() => {
    void loadChats();
  }, [loadChats]);

  useEffect(() => {
    setSocketReady(false);
    setHistoryError("");
    setMessages([]);

    if (!selectedChatId || !currentUserId) {
      closeSocket();
      return;
    }

    let cancelled = false;
    const generation = socketGenerationRef.current + 1;
    socketGenerationRef.current = generation;

    const connect = async () => {
      try {
        const token = accessToken || (await refreshAccessToken());
        if (!token || cancelled || socketGenerationRef.current !== generation) {
          return;
        }

        closeSocket();

        const socket = new WebSocket(`${CHAT_WS_URL}/ws/${selectedChatId}/${currentUserId}?token=${encodeURIComponent(token)}`);
        socketRef.current = socket;
        let opened = false;
        let connectionErrorReported = false;

        socket.onopen = () => {
          if (cancelled || socketGenerationRef.current !== generation || socketRef.current !== socket) {
            return;
          }

          opened = true;
          setSocketReady(true);
        };

        socket.onerror = () => {
          if (cancelled || socketGenerationRef.current !== generation || socketRef.current !== socket || connectionErrorReported) {
            return;
          }

          connectionErrorReported = true;
          toast.danger("Ошибка подключения к чату.");
        };

        socket.onclose = () => {
          if (cancelled || socketGenerationRef.current !== generation || socketRef.current !== socket) {
            return;
          }

          socketRef.current = null;
          setSocketReady(false);
          if (!opened && !connectionErrorReported) {
            toast.danger("Ошибка подключения к чату.");
          }
        };

        socket.onmessage = (event) => {
          if (cancelled || socketGenerationRef.current !== generation || socketRef.current !== socket) {
            return;
          }

          handleSocketMessage(event.data);
        };
      } catch (error) {
        if (!cancelled) {
          toast.danger(getErrorMessage(error));
        }
      }
    };

    void connect();

    return () => {
      cancelled = true;
      closeSocket();
    };
  }, [accessToken, closeSocket, currentUserId, handleSocketMessage, refreshAccessToken, selectedChatId, toast]);

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }

    messageListEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const canCreateChats = Boolean(user && (user.role === "operator" || user.role === "admin"));
  const canManageChatParticipants = canCreateChats;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 p-6 text-white shadow-2xl shadow-slate-900/15 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-slate-100">
              <MessageSquare className="h-3.5 w-3.5" />
              Чаты
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Чат-центр</h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
                Список чатов, история сообщений и live-переписка через WebSocket без переключения контекста.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-slate-100">
            <Users className="h-4 w-4" />
            {chats.length} {chats.length === 1 ? "чат" : "чатов"}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-2xl border border-border bg-card/95 shadow-lg shadow-slate-900/5 xl:sticky xl:top-24 xl:h-[calc(100vh-7rem)] xl:self-start">
          <div className="flex items-center justify-between border-b border-border px-6 py-5">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Список чатов</h2>
              <p className="text-sm text-muted-foreground">{chats.length} доступных чатов</p>
            </div>

            <RoleGuard minRole="operator">
              <Button type="button" variant="outline-primary" size="sm" className="shrink-0" onClick={openCreateModal} data-testid="create-chat-button">
                <Plus className="h-4 w-4" />
                Создать новый чат
              </Button>
            </RoleGuard>
          </div>

          <div className="flex h-full flex-col">
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {chatsLoading ? (
                <div className="flex min-h-[240px] items-center justify-center rounded-2xl border border-dashed border-border bg-background/70 px-4 py-8 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Загрузка чатов...
                  </span>
                </div>
              ) : chatsError ? (
                <div data-testid="chat-list-error" className="rounded-2xl border border-dashed border-destructive/30 bg-destructive/5 px-4 py-6 text-sm text-destructive">
                  {chatsError}
                </div>
              ) : chats.length === 0 ? (
                <div data-testid="chat-empty-state" className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-background/70 px-4 py-8 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <MessageSquare className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold tracking-tight">Чаты не найдены</h3>
                  <p className="mt-2 max-w-[260px] text-sm leading-6 text-muted-foreground">
                    Начните новый диалог или добавьте участников в существующий чат.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {chats.map((chat) => {
                    const isActive = chat.id === selectedChatId;

                    return (
                      <article
                        key={chat.id}
                        data-testid={`chat-list-item-${chat.id}`}
                        className={cn(
                          "rounded-2xl border p-4 transition-colors",
                          isActive ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-background/70 hover:border-primary/30 hover:bg-primary/5/40",
                        )}
                      >
                        <button
                          type="button"
                          className="w-full text-left"
                          onClick={() => handleSelectChat(chat.id)}
                          data-testid={`chat-open-${chat.id}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 space-y-1">
                              <div className="truncate text-sm font-semibold text-foreground">{chat.name || "Без названия"}</div>
                              <div className="text-xs text-muted-foreground">
                                {chat.is_group ? "Групповой чат" : "Личный чат"} · {chat.participants.length} участников
                              </div>
                              <div className="text-xs text-muted-foreground">{formatDateTime(chat.created_at)}</div>
                            </div>
                            <span
                              className={cn(
                                "rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em]",
                                chat.is_group ? "bg-sky-500/10 text-sky-700" : "bg-slate-500/10 text-slate-700",
                              )}
                            >
                              {chat.is_group ? "group" : "direct"}
                            </span>
                          </div>
                        </button>

                        {canManageChatParticipants ? (
                          <div className="mt-3 flex justify-end">
                            <Button
                              type="button"
                              variant="outline-secondary"
                              size="sm"
                              className="shrink-0"
                              onClick={() => void openAddParticipantsModal(chat.id)}
                              data-testid={`chat-add-participants-${chat.id}`}
                            >
                              <UserPlus className="h-4 w-4" />
                              Добавить участников
                            </Button>
                          </div>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </aside>

        <section className="overflow-hidden rounded-2xl border border-border bg-card/95 shadow-lg shadow-slate-900/5">
          {!currentChat ? (
            <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary">
                <MessageSquare className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-semibold tracking-tight">Выберите чат</h2>
              <p className="mt-3 max-w-lg text-sm leading-6 text-muted-foreground">
                Откройте чат слева, чтобы посмотреть историю, подключиться к WebSocket и отправлять сообщения.
              </p>
            </div>
          ) : (
            <div className="flex min-h-[70vh] flex-col">
              <div className="border-b border-border px-6 py-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-2xl font-semibold tracking-tight">{currentChat.name || "Без названия"}</h2>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium uppercase tracking-[0.18em]",
                          currentChat.is_group ? "bg-sky-500/10 text-sky-700" : "bg-slate-500/10 text-slate-700",
                        )}
                      >
                        {currentChat.is_group ? "Групповой" : "Личный"}
                      </span>
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
                          socketReady ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-700",
                        )}
                      >
                        {socketReady ? "Подключено" : "Подключение..."}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {currentChat.participants.length} участников · создан {formatDateTime(currentChat.created_at)}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      variant="outline-secondary"
                      size="sm"
                      disabled={historyLoading}
                      onClick={() => void handleLoadHistory()}
                      data-testid="chat-history-button"
                    >
                      <History className="h-4 w-4" />
                      {historyLoading ? "Загрузка..." : "Показать историю"}
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex flex-1 flex-col px-6 py-5">
                <div className="mb-4 min-h-0 flex-1 overflow-y-auto rounded-2xl border border-border bg-muted/20 p-4">
                  {historyError ? (
                    <div data-testid="chat-history-error" className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                      {historyError}
                    </div>
                  ) : null}

                  {historyLoading ? (
                    <div className="flex min-h-[220px] items-center justify-center text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-3">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Загружаем историю...
                      </span>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
                      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                        <History className="h-7 w-7" />
                      </div>
                      <h3 className="text-lg font-semibold tracking-tight">История пока не загружена</h3>
                      <p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">
                        Нажмите «Показать историю» или дождитесь новых сообщений в WebSocket.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((message) => {
                        const isOwn = message.sender_id === currentUserId;

                        return (
                          <article
                            key={message.id}
                            data-testid={`chat-message-${message.id}`}
                            className={cn("flex", isOwn ? "justify-end" : "justify-start")}
                          >
                            <div
                              className={cn(
                                "max-w-[85%] rounded-2xl px-4 py-3 shadow-sm",
                                isOwn ? "bg-primary text-primary-foreground" : "bg-background border border-border text-foreground",
                              )}
                            >
                              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                                <strong className="font-semibold">{message.senderName}</strong>
                                <span className={cn(isOwn ? "text-primary-foreground/75" : "text-muted-foreground")}>
                                  {formatDateTime(message.created_at)}
                                </span>
                              </div>
                              <p className="whitespace-pre-wrap break-words text-sm leading-6">{message.content}</p>
                            </div>
                          </article>
                        );
                      })}
                      <div ref={messageListEndRef} />
                    </div>
                  )}
                </div>

                <form className="space-y-3 border-t border-border pt-5" onSubmit={handleSendMessage}>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <Input
                      type="text"
                      name="message"
                      label="Сообщение"
                      labelHidden
                      placeholder={socketReady ? "Введите сообщение..." : "Выберите чат и дождитесь подключения"}
                      value={messageDraft}
                      onChange={(event) => setMessageDraft(event.target.value)}
                      maxLength={MESSAGE_MAX_LENGTH}
                      disabled={!currentChat || !socketReady}
                      wrapperClassName="mb-0 flex-1"
                      data-testid="chat-message-input"
                    />
                    <Button
                      type="submit"
                      disabled={!currentChat || !socketReady}
                      className="sm:w-auto"
                      data-testid="chat-send-button"
                    >
                      <Send className="h-4 w-4" />
                      Отправить
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Enter отправляет сообщение, длина ограничена {MESSAGE_MAX_LENGTH} символами.
                  </p>
                </form>
              </div>
            </div>
          )}
        </section>
      </div>

      {createModalOpen ? (
        <Modal title="Создать новый чат" onClose={closeCreateModal} size="lg">
          <form className="space-y-5" onSubmit={handleCreateChat}>
            <Input
              name="chat-name"
              label="Название чата"
              placeholder="Введите название"
              value={createName}
              onChange={(event) => setCreateName(event.target.value)}
              required
              wrapperClassName="mb-0"
            />

            <label className="flex items-start gap-3 rounded-2xl border border-border bg-background/80 px-4 py-3">
              <Checkbox
                name="group-chat"
                data-testid="group-chat"
                checked={createIsGroup}
                onCheckedChange={(checked) => setCreateIsGroup(Boolean(checked))}
                aria-label="group-chat"
              />
              <span className="space-y-1">
                <span className="block text-sm font-medium">Групповой чат</span>
                <span className="block text-xs text-muted-foreground">
                  Включите для чатов с несколькими участниками.
                </span>
              </span>
            </label>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Участники</h3>
                  <p className="text-xs text-muted-foreground">Текущий пользователь добавляется автоматически.</p>
                </div>
                {participantUsersLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
              </div>

              {participantUsersError ? (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {participantUsersError}
                </div>
              ) : null}

              <div className="max-h-72 space-y-3 overflow-y-auto rounded-2xl border border-border bg-muted/10 p-3">
                <div className="rounded-2xl border border-border bg-background/80 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <Checkbox name="current-user" data-testid="current-user" checked disabled aria-label="current-user" />
                    <div className="space-y-1">
                      <div className="text-sm font-medium">{user?.name || "Вы"}</div>
                      <div className="text-xs text-muted-foreground">Добавляется автоматически</div>
                    </div>
                  </div>
                </div>

                {participantUsersLoading ? (
                  <div className="flex min-h-[160px] items-center justify-center text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Загрузка пользователей...
                    </span>
                  </div>
                ) : createSelectableUsers.length === 0 ? (
                  <div className="flex min-h-[120px] items-center justify-center text-sm text-muted-foreground">
                    Пользователи не найдены
                  </div>
                ) : (
                  createSelectableUsers.map((participant) => {
                    const checked = createParticipantIds.includes(participant.id);
                    return (
                      <div key={participant.id} className="rounded-2xl border border-border bg-background/80 px-4 py-3">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            name={`create-participant-${participant.id}`}
                            data-testid={`create-participant-${participant.id}`}
                            checked={checked}
                            onCheckedChange={(nextChecked) => {
                              setCreateParticipantIds((currentIds) =>
                                nextChecked
                                  ? Array.from(new Set([...currentIds, participant.id]))
                                  : currentIds.filter((id) => id !== participant.id),
                              );
                            }}
                            aria-label={`create-participant-${participant.id}`}
                          />
                          <div className="space-y-1">
                            <div className="text-sm font-medium">{participant.name}</div>
                            <div className="text-xs text-muted-foreground">{participant.email}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline-secondary" onClick={closeCreateModal}>
                Отмена
              </Button>
              <Button type="submit" disabled={createSubmitting}>
                {createSubmitting ? "Создание..." : "Создать чат"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}

      {addModalChatId ? (
        <Modal title="Добавить участников" onClose={closeAddParticipantsModal} size="lg">
          <form className="space-y-5" onSubmit={handleAddParticipants}>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold tracking-tight">{addModalChat?.name || "Чат"}</h3>
              <p className="text-sm text-muted-foreground">
                Выберите пользователей, которых нужно добавить в чат. Уже существующие участники скрыты.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Доступные пользователи</h3>
                {participantUsersLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : null}
              </div>

              {participantUsersError ? (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                  {participantUsersError}
                </div>
              ) : null}

              <div className="max-h-72 space-y-3 overflow-y-auto rounded-2xl border border-border bg-muted/10 p-3">
                {participantUsersLoading ? (
                  <div className="flex min-h-[160px] items-center justify-center text-sm text-muted-foreground">
                    <span className="inline-flex items-center gap-3">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Загрузка пользователей...
                    </span>
                  </div>
                ) : addSelectableUsers.length === 0 ? (
                  <div className="flex min-h-[120px] items-center justify-center text-sm text-muted-foreground">
                    Пользователи не найдены
                  </div>
                ) : (
                  addSelectableUsers.map((participant) => {
                    const checked = addParticipantIds.includes(participant.id);
                    return (
                      <div key={participant.id} className="rounded-2xl border border-border bg-background/80 px-4 py-3">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            name={`add-participant-${participant.id}`}
                            data-testid={`add-participant-${participant.id}`}
                            checked={checked}
                            onCheckedChange={(nextChecked) => {
                              setAddParticipantIds((currentIds) =>
                                nextChecked
                                  ? Array.from(new Set([...currentIds, participant.id]))
                                  : currentIds.filter((id) => id !== participant.id),
                              );
                            }}
                            aria-label={`add-participant-${participant.id}`}
                          />
                          <div className="space-y-1">
                            <div className="text-sm font-medium">{participant.name}</div>
                            <div className="text-xs text-muted-foreground">{participant.email}</div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline-secondary" onClick={closeAddParticipantsModal}>
                Отмена
              </Button>
              <Button type="submit" disabled={addSubmitting}>
                {addSubmitting ? "Добавление..." : "Добавить участников"}
              </Button>
            </div>
          </form>
        </Modal>
      ) : null}
    </div>
  );
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("ru-RU");
}
