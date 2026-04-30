import { AUTH_API_URL, CHAT_API_URL } from "../config";
import { parseApiResponse } from "../lib/http";
import type { AdminUser, Chat, ChatCreatePayload, ChatMessage } from "../types";
import type { AuthorizedFetch } from "./products";

export function listChats(fetcher: AuthorizedFetch) {
  return fetcher<Chat[]>(`${CHAT_API_URL}/chats/`);
}

export function getChat(fetcher: AuthorizedFetch, chatId: string) {
  return fetcher<Chat>(`${CHAT_API_URL}/chats/${chatId}`);
}

export function listChatMessages(fetcher: AuthorizedFetch, chatId: string) {
  return fetcher<ChatMessage[]>(`${CHAT_API_URL}/chats/${chatId}/messages`);
}

export function createChat(fetcher: AuthorizedFetch, payload: ChatCreatePayload) {
  return fetcher<Chat>(`${CHAT_API_URL}/chats/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function addUserToChat(fetcher: AuthorizedFetch, chatId: string, userId: string) {
  const query = new URLSearchParams({ chat_id: chatId, user_id: userId });
  return fetcher<{ message: string }>(`${CHAT_API_URL}/chats/add_user?${query.toString()}`, {
    method: "PATCH",
  });
}

export function getUserDisplayName(fetcher: AuthorizedFetch, userId: string) {
  return fetcher<{ name: string }>(`${AUTH_API_URL}/user_name/${userId}`);
}

export function listChatParticipants(fetcher: AuthorizedFetch) {
  return fetcher<{ users: AdminUser[] }>(`${AUTH_API_URL}/users?page=1&page_size=100&sort_by=name&order=asc`);
}

export async function parseChatApiResponse<T>(response: Response) {
  return parseApiResponse<T>(response);
}
