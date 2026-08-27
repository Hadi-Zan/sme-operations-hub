import "server-only";

export function requireAppUrl() {
  const configured = process.env.APP_BASE_URL;

  if (!configured) {
    throw new Error("APP_BASE_URL is not configured.");
  }

  const url = new URL(configured);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("APP_BASE_URL must use http or https.");
  }
  if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error("APP_BASE_URL must use https in production.");
  }

  return url.origin;
}
