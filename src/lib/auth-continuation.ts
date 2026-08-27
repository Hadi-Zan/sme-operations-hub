export const AUTH_CONTINUATION_COOKIE = "sme-auth-continuation";
export const AUTH_CONTINUATION_MAX_AGE_SECONDS = 10 * 60;
export const authContinuationTypes = ["email", "invite", "magiclink", "recovery"] as const;
export type AuthContinuationType = (typeof authContinuationTypes)[number];

export type AuthContinuation = {
  tokenHash: string;
  type: AuthContinuationType;
};

const tokenHashPattern = /^[A-Za-z0-9_-]{20,2048}$/;

export function isAuthContinuationType(value: string): value is AuthContinuationType {
  return authContinuationTypes.some((type) => type === value);
}

export function parseAuthFragment(fragment: string): AuthContinuation | null {
  const params = new URLSearchParams(fragment.startsWith("#") ? fragment.slice(1) : fragment);
  const tokenHash = params.get("token_hash") ?? "";
  const type = params.get("type") ?? "";

  if (!tokenHashPattern.test(tokenHash) || !isAuthContinuationType(type)) return null;
  return { tokenHash, type };
}

export function encodeAuthContinuation(value: AuthContinuation) {
  return `${value.type}.${value.tokenHash}`;
}

export function decodeAuthContinuation(value: string | undefined): AuthContinuation | null {
  if (!value || value.length > 4096) return null;

  const separator = value.indexOf(".");
  if (separator <= 0) return null;
  const type = value.slice(0, separator);
  const tokenHash = value.slice(separator + 1);
  if (!isAuthContinuationType(type) || !tokenHashPattern.test(tokenHash)) return null;
  return { tokenHash, type };
}
