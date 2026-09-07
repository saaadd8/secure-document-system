const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function request(path, { method = "GET", token, body, responseType = "json" } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !(body instanceof FormData)) headers["Content-Type"] = "application/json";

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body ? (body instanceof FormData ? body : JSON.stringify(body)) : undefined,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new ApiError(payload?.detail || "Request failed", response.status);
  }

  if (responseType === "download") {
    const disposition = response.headers.get("content-disposition") || "";
    const utf8Match = disposition.match(/filename\*=UTF-8''([^;]+)/i);
    const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
    const filename = utf8Match ? decodeURIComponent(utf8Match[1]) : filenameMatch?.[1];
    return { blob: await response.blob(), filename };
  }
  if (response.status === 204) return null;
  return response.json();
}

export const authApi = {
  register: (payload) => request("/auth/register", { method: "POST", body: payload }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload }),
  me: (token) => request("/auth/me", { token }),
};

export const documentsApi = {
  list: (token) => request("/documents", { token }),
  upload: (token, file) => {
    const body = new FormData();
    body.append("file", file);
    return request("/documents/upload", { method: "POST", token, body });
  },
  download: (token, documentId) =>
    request(`/documents/${documentId}/download`, { token, responseType: "download" }),
  verify: (token, documentId) => request(`/documents/${documentId}/verify`, { token }),
  createShare: (token, documentId, payload) =>
    request(`/documents/${documentId}/shares`, { method: "POST", token, body: payload }),
  listShares: (token, documentId) => request(`/documents/${documentId}/shares`, { token }),
  listShared: (token) => request("/documents/shared", { token }),
  revokeShare: (token, documentId, shareId) =>
    request(`/documents/${documentId}/shares/${shareId}`, { method: "DELETE", token }),
};

export const auditLogsApi = {
  list: (token, filters = {}) => {
    const query = new URLSearchParams();
    if (filters.documentId) query.set("document_id", filters.documentId);
    if (filters.action) query.set("action", filters.action);
    const suffix = query.size ? `?${query}` : "";
    return request(`/audit-logs${suffix}`, { token });
  },
};
