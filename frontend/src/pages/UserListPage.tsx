import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ArrowUpDown, RotateCcw, Users } from "lucide-react";
import { listUsers, updateUserRole } from "../api/auth";
import { getErrorMessage } from "../lib/http";
import { useAuth } from "../state/AuthContext";
import type { AdminUser, PaginatedUsersResponse, SortOrder, UserRole, UserSortField } from "../types";
import { Button } from "../ui/Button";
import { Input } from "../ui/Input";
import { Select } from "../ui/Select";
import { TableState } from "../ui/TableState";
import { cn } from "../lib/utils";
import { useToast } from "../ui/Toast";

const ROLE_LABELS: Record<UserRole, string> = {
  customer: "Клиент",
  operator: "Оператор",
  admin: "Администратор",
};

const ROLE_BADGE_CLASSES: Record<UserRole, string> = {
  customer: "bg-slate-500/10 text-slate-700 ring-1 ring-slate-500/20",
  operator: "bg-sky-500/10 text-sky-700 ring-1 ring-sky-500/20",
  admin: "bg-emerald-500/10 text-emerald-700 ring-1 ring-emerald-500/20",
};

const ROLE_FILTER_OPTIONS: Array<{ value: "all" | UserRole; label: string }> = [
  { value: "all", label: "Все роли" },
  { value: "customer", label: "Клиент" },
  { value: "operator", label: "Оператор" },
  { value: "admin", label: "Администратор" },
];

const PAGE_SIZE_OPTIONS = [10, 20, 50];
const DEFAULT_SORT_FIELD: UserSortField = "name";
const DEFAULT_SORT_ORDER: SortOrder = "asc";

export function UserListPage() {
  const { authorizedFetch } = useAuth();
  const toast = useToast();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortField, setSortField] = useState<UserSortField>(DEFAULT_SORT_FIELD);
  const [sortOrder, setSortOrder] = useState<SortOrder>(DEFAULT_SORT_ORDER);
  const [roleFilter, setRoleFilter] = useState<"all" | UserRole>("all");
  const [searchDraft, setSearchDraft] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [tableError, setTableError] = useState("");
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setTableError("");

    try {
      const response: PaginatedUsersResponse = await listUsers(authorizedFetch, {
        page,
        pageSize,
        sortBy: sortField,
        order: sortOrder,
        search: debouncedSearch || undefined,
        role: roleFilter === "all" ? undefined : roleFilter,
      });

      setUsers(response.users);
      setTotal(response.total);
      setTotalPages(response.total_pages);
      setPage(response.page);
      setPageSize(response.page_size);
    } catch (error) {
      const message = getErrorMessage(error);
      setUsers([]);
      setTotal(0);
      setTotalPages(0);
      setTableError(message);
      toast.danger(message);
    } finally {
      setLoading(false);
    }
  }, [authorizedFetch, debouncedSearch, page, pageSize, roleFilter, sortField, sortOrder, toast]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const normalizedSearch = searchDraft.trim();
      setDebouncedSearch(normalizedSearch);
      setPage(1);
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchDraft]);

  const paginationPages = useMemo(() => {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }, [totalPages]);

  const visibleRangeLabel = useMemo(() => {
    if (total === 0 || users.length === 0) {
      return "Нет пользователей";
    }

    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);
    return `Показано ${start}–${end} из ${total}`;
  }, [page, pageSize, total, users.length]);

  const handleSort = (field: UserSortField) => {
    setPage(1);

    if (sortField === field) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortField(field);
    setSortOrder("asc");
  };

  const handleRoleChange = async (user: AdminUser, nextRole: UserRole) => {
    if (nextRole === user.role || updatingUserId === user.id) {
      return;
    }

    setUpdatingUserId(user.id);
    try {
      await updateUserRole(authorizedFetch, user.id, nextRole);
      toast.success("Роль пользователя обновлена");
    } catch (error) {
      toast.danger(getErrorMessage(error));
    } finally {
      try {
        await loadUsers();
      } finally {
        setUpdatingUserId(null);
      }
    }
  };

  const handleReset = () => {
    setSearchDraft("");
    setDebouncedSearch("");
    setRoleFilter("all");
    setPageSize(10);
    setSortField(DEFAULT_SORT_FIELD);
    setSortOrder(DEFAULT_SORT_ORDER);
    setPage(1);
  };

  const handlePageSizeChange = (value: string) => {
    setPage(1);
    setPageSize(Number(value));
  };

  const handleRoleFilterChange = (value: string) => {
    setPage(1);
    setRoleFilter(value as "all" | UserRole);
  };

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-slate-950 via-slate-900 to-sky-900 p-6 text-white shadow-2xl shadow-slate-900/15 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-slate-100">
              <Users className="h-3.5 w-3.5" />
              Пользователи
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Управление пользователями</h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
                Серверный поиск, сортировка, фильтры и смена ролей для администраторов.
              </p>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm text-slate-100">
            <Users className="h-4 w-4" />
            {total} {total === 1 ? "пользователь" : "пользователей"}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card/95 shadow-lg shadow-slate-900/5">
        <div className="border-b border-border px-6 py-5">
          <h2 className="text-xl font-semibold tracking-tight">Список пользователей</h2>
        </div>

        <div className="grid gap-3 border-b border-border px-6 py-5 lg:grid-cols-[minmax(0,1fr)_220px_180px_auto]">
          <Input
            type="search"
            name="search"
            label="Поиск"
            labelHidden
            placeholder="Поиск по имени или email"
            value={searchDraft}
            onChange={(event) => setSearchDraft(event.target.value)}
            wrapperClassName="mb-0"
          />

          <Select
            name="role-filter"
            label="Фильтр роли"
            value={roleFilter}
            onChange={(event) => handleRoleFilterChange(event.target.value)}
            wrapperClassName="mb-0"
          >
            {ROLE_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>

          <Select
            name="page-size"
            label="На странице"
            value={String(pageSize)}
            onChange={(event) => handlePageSizeChange(event.target.value)}
            wrapperClassName="mb-0"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>

          <Button type="button" variant="outline-secondary" onClick={handleReset} className="justify-center lg:justify-start">
            <RotateCcw className="h-4 w-4" />
            Сбросить
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] border-separate border-spacing-0">
            <colgroup>
              <col className="w-[18%]" />
              <col className="w-[26%]" />
              <col className="w-[30%]" />
              <col className="w-[14%]" />
              <col className="w-[12%]" />
            </colgroup>
            <thead className="bg-muted/60 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <tr>
                <SortableHeaderCell
                  label="ID"
                  field="id"
                  sortField={sortField}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortableHeaderCell
                  label="Имя"
                  field="name"
                  sortField={sortField}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortableHeaderCell
                  label="Email"
                  field="email"
                  sortField={sortField}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <SortableHeaderCell
                  label="Роль"
                  field="role"
                  sortField={sortField}
                  sortOrder={sortOrder}
                  onSort={handleSort}
                />
                <th className="px-6 py-4 text-center">Действия</th>
              </tr>
            </thead>
            <TableState loading={loading} error={tableError} empty={users.length === 0} emptyMessage="Пользователи не найдены" colSpan={5}>
              {users.map((user) => (
                <tr key={user.id} data-testid={`user-row-${user.id}`} className="border-t border-border/60 text-sm">
                  <td className="break-all px-6 py-4 align-top text-muted-foreground">{user.id}</td>
                  <td className="px-6 py-4 align-top font-medium text-foreground">{user.name}</td>
                  <td className="px-6 py-4 align-top text-muted-foreground">{user.email}</td>
                  <td className="px-6 py-4 align-top">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
                        ROLE_BADGE_CLASSES[user.role],
                      )}
                    >
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <Select
                      name={`user-role-${user.id}`}
                      label={`Роль ${user.name}`}
                      labelHidden
                      value={user.role}
                      onChange={(event) => handleRoleChange(user, event.target.value as UserRole)}
                      disabled={updatingUserId === user.id}
                      wrapperClassName="mb-0 min-w-[180px]"
                      data-testid={`user-role-select-${user.id}`}
                    >
                      <option value="customer">Клиент</option>
                      <option value="operator">Оператор</option>
                      <option value="admin">Администратор</option>
                    </Select>
                  </td>
                </tr>
              ))}
            </TableState>
          </table>
        </div>

        {!loading && !tableError && totalPages > 1 ? (
          <div className="flex flex-col gap-3 border-t border-border px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-sm text-muted-foreground">{visibleRangeLabel}</p>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline-secondary"
                size="sm"
                disabled={page === 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Назад
              </Button>

              {paginationPages.map((pageNumber) => (
                <Button
                  key={pageNumber}
                  type="button"
                  size="sm"
                  variant={pageNumber === page ? "primary" : "outline-secondary"}
                  onClick={() => setPage(pageNumber)}
                  className="min-w-[2.5rem]"
                >
                  {pageNumber}
                </Button>
              ))}

              <Button
                type="button"
                variant="outline-secondary"
                size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              >
                Вперёд
              </Button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function SortableHeaderCell({
  label,
  field,
  sortField,
  sortOrder,
  onSort,
}: {
  label: string;
  field: UserSortField;
  sortField: UserSortField;
  sortOrder: SortOrder;
  onSort: (field: UserSortField) => void;
}) {
  const isActive = sortField === field;
  const icon = !isActive ? (
    <ArrowUpDown className="h-3.5 w-3.5" />
  ) : sortOrder === "asc" ? (
    <ArrowUp className="h-3.5 w-3.5" />
  ) : (
    <ArrowDown className="h-3.5 w-3.5" />
  );

  return (
    <th className="px-6 py-4">
      <button
        type="button"
        onClick={() => onSort(field)}
        className={cn(
          "inline-flex items-center gap-1.5 text-left transition-colors hover:text-foreground",
          isActive ? "text-foreground" : "text-muted-foreground",
        )}
      >
        <span>{label}</span>
        {icon}
      </button>
    </th>
  );
}
