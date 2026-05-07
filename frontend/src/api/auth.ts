import { AUTH_API_URL } from "../config";
import type {
  CurrentUser,
  LoginResponse,
  PaginatedUsersResponse,
  RefreshTokenResponse,
  DeleteUserResponse,
  SortOrder,
  UserRole,
  UserUpdateResponse,
  UserSortField,
} from "../types";
import { parseApiResponse } from "../lib/http";

type AuthorizedFetch = <T>(url: string, init?: RequestInit) => Promise<T>;

type ListUsersParams = {
  page?: number;
  pageSize?: number;
  sortBy?: UserSortField;
  order?: SortOrder;
  search?: string;
  role?: UserRole | "all";
};

export async function login(email: string, password: string, rememberMe: boolean) {
  const response = await fetch(`${AUTH_API_URL}/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, remember_me: rememberMe }),
  });
  return parseApiResponse<LoginResponse>(response);
}

export async function register(name: string, email: string, password: string) {
  const response = await fetch(`${AUTH_API_URL}/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  });
  return parseApiResponse(response);
}

export async function refreshToken() {
  const response = await fetch(`${AUTH_API_URL}/refresh-token`, {
    method: "POST",
    credentials: "include",
  });
  return parseApiResponse<RefreshTokenResponse>(response);
}

export async function logout() {
  const response = await fetch(`${AUTH_API_URL}/logout`, {
    method: "POST",
    credentials: "include",
  });
  return parseApiResponse<{ detail: string }>(response);
}

export async function getMe(accessToken: string) {
  const response = await fetch(`${AUTH_API_URL}/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  return parseApiResponse<CurrentUser>(response);
}

function buildUsersUrl(params: ListUsersParams = {}) {
  const query = new URLSearchParams();
  query.set("page", String(params.page ?? 1));
  query.set("page_size", String(params.pageSize ?? 10));
  query.set("sort_by", params.sortBy ?? "name");
  query.set("order", params.order ?? "asc");

  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }

  if (params.role && params.role !== "all") {
    query.set("role", params.role);
  }

  return `${AUTH_API_URL}/users?${query.toString()}`;
}

export function listUsers(fetcher: AuthorizedFetch, params: ListUsersParams = {}) {
  return fetcher<PaginatedUsersResponse>(buildUsersUrl(params));
}

type UpdateUserPayload = {
  name: string;
  email: string;
};

export function updateUser(fetcher: AuthorizedFetch, userId: string, payload: UpdateUserPayload) {
  return fetcher<UserUpdateResponse>(`${AUTH_API_URL}/users/edit/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateUserRole(fetcher: AuthorizedFetch, userId: string, role: UserRole) {
  return fetcher<{ detail: string; role: UserRole }>(`${AUTH_API_URL}/users/${userId}/role`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ role }),
  });
}

export function deleteUser(fetcher: AuthorizedFetch, userId: string) {
  return fetcher<DeleteUserResponse>(`${AUTH_API_URL}/users/delete/${userId}`, {
    method: "DELETE",
  });
}
