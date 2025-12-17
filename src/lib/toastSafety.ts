// Centralized toast safety utilities.
// Purpose: prevent React runtime crashes when non-string values are passed to toast title/description/message.

export const TOASTS_SUPPRESSED_KEY = "uct_toasts_suppressed";

export function setToastsSuppressed(suppressed: boolean) {
  if (typeof window === "undefined") return;
  try {
    if (suppressed) sessionStorage.setItem(TOASTS_SUPPRESSED_KEY, "1");
    else sessionStorage.removeItem(TOASTS_SUPPRESSED_KEY);
  } catch {
    // ignore
  }
}

export function areToastsSuppressed(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(TOASTS_SUPPRESSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function coerceToastText(input: unknown): string | undefined {
  if (input === null || input === undefined) return undefined;

  // already safe primitives
  if (typeof input === "string") return input;
  if (typeof input === "number" || typeof input === "boolean" || typeof input === "bigint") {
    return String(input);
  }

  // errors
  if (input instanceof Error) return input.message;

  // objects with a message field (Supabase/PostgREST-style errors, etc.)
  if (typeof input === "object") {
    const maybeMsg = (input as any)?.message;
    if (typeof maybeMsg === "string" && maybeMsg.trim().length > 0) return maybeMsg;

    try {
      const json = JSON.stringify(input);
      // Avoid empty object output when we can do better
      if (json && json !== "{}") return json;
    } catch {
      // ignore
    }

    try {
      return String(input);
    } catch {
      return "Notification";
    }
  }

  // symbols, functions, etc.
  try {
    return String(input);
  } catch {
    return "Notification";
  }
}
