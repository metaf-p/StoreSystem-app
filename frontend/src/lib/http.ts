export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

function extractErrorDetail(details: unknown) {
  if (typeof details === "string") {
    return details;
  }

  if (Array.isArray(details)) {
    const messages = details
      .map((entry) => {
        if (typeof entry === "string") {
          return entry;
        }
        if (entry && typeof entry === "object") {
          const message = "msg" in entry && typeof entry.msg === "string" ? entry.msg : "";
          const location =
            "loc" in entry && Array.isArray(entry.loc)
              ? entry.loc
                  .filter((part: unknown): part is string | number => typeof part === "string" || typeof part === "number")
                  .join(".")
              : "";
          if (message && location) {
            return `${location}: ${message}`;
          }
          return message;
        }
        return "";
      })
      .filter(Boolean);

    return messages.join("; ");
  }

  if (details && typeof details === "object" && "detail" in details) {
    return extractErrorDetail((details as { detail?: unknown }).detail);
  }

  return "";
}

export async function parseApiResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message = extractErrorDetail(payload) || `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, payload);
  }

  return payload as T;
}

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    const detail = extractErrorDetail(error.details);
    if (error.status === 401) {
      return detail || "Сессия истекла. Войдите снова.";
    }
    if (error.status === 403) {
      return detail || "Недостаточно прав.";
    }
    if (error.status === 422) {
      return detail || error.message || "Проверьте введённые данные.";
    }
    return detail || error.message || "Произошла ошибка.";
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Произошла ошибка. Попробуйте ещё раз.";
}
