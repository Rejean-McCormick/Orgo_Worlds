export interface Actor {
  workGrants?: {
    scope_type: string;
    scope_reference: string;
    role_id: string;
    permissions: string[];
  }[];
  organizationId: string;
  worldId?: string;
  worldKey?: string;
  worldTitle?: string;
  worldReleaseId?: string;
  worldReleaseNumber?: number;
  worldRole?: "owner" | "maintainer" | "member" | "viewer";
  worldStatus?: string;
  actorUserId: string | null;
  permissions: string[];
  roleIds: string[];
}
export interface Row {
  [key: string]: unknown;
}
export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}
const TOKEN_KEY = "orgo-worlds:session-token";
const GLOBAL_PATH = /^(?:auth\/(?:login|sso(?:\/|$))|control\/)/;

export class OrgoClient {
  private pendingKeys = new Map<string, string>();
  private _token = "";
  constructor(
    token = "",
    private baseUrl = "/api/v3",
    public worldKey?: string,
  ) {
    this._token = token || this.readSessionToken();
  }
  private readSessionToken() {
    if (typeof window === "undefined") return "";
    try {
      return window.sessionStorage.getItem(TOKEN_KEY) ?? "";
    } catch {
      return "";
    }
  }
  get token() {
    return this._token;
  }
  set token(value: string) {
    this._token = value;
    if (typeof window === "undefined") return;
    try {
      if (value) window.sessionStorage.setItem(TOKEN_KEY, value);
      else window.sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      // Session persistence is a convenience; in-memory auth still works.
    }
  }
  private endpoint(path: string) {
    const clean = path.replace(/^\/+/, "");
    const scoped = this.worldKey && !GLOBAL_PATH.test(clean);
    return `${this.baseUrl}${scoped ? `/w/${encodeURIComponent(this.worldKey!)}` : ""}/${clean}`;
  }
  async download(path: string): Promise<string> {
    const response = await fetch(this.endpoint(path), {
      headers: { Authorization: `Bearer ${this.token}` },
    });
    if (!response.ok)
      throw new Error(
        "Export impossible : vérifiez vos permissions et votre connexion.",
      );
    return response.text();
  }
  async request<T>(
    path: string,
    method = "GET",
    input?: unknown,
    key?: string,
  ): Promise<T> {
    const signature = `${this.worldKey ?? "global"}:${method}:${path}:${JSON.stringify(input)}`;
    const mutationKey =
      method === "GET"
        ? undefined
        : (key ?? this.pendingKeys.get(signature) ?? crypto.randomUUID());
    if (mutationKey) this.pendingKeys.set(signature, mutationKey);
    const response = await fetch(this.endpoint(path), {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
        ...(method !== "GET" ? { "Idempotency-Key": mutationKey! } : {}),
      },
      body: input === undefined ? undefined : JSON.stringify(input),
    });
    const result = await response.json();
    if (response.status < 500) this.pendingKeys.delete(signature);
    if (!response.ok || !result.ok)
      throw new ApiError(
        result.error?.code ?? "NETWORK_ERROR",
        result.error?.message ?? "La requête a échoué.",
        result.error?.details,
      );
    return result.data as T;
  }
}
export const can = (actor: Actor, permission: string) =>
  actor.permissions.includes("*") ||
  actor.permissions.includes(permission) ||
  (permission.startsWith("work:") &&
    (actor.workGrants ?? []).some((g) => g.permissions.includes(permission)));
export const str = (value: unknown) => (value == null ? "" : String(value));
export const rows = (value: unknown): Row[] =>
  Array.isArray(value) ? value.filter((v) => v && typeof v === "object") : [];
export const rowId = (row: Row) =>
  str(row.id ?? row.task_id ?? row.signal_id ?? row.case_id);
