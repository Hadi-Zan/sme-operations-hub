import { describe, expect, it } from "vitest";
import {
  decodeAuthContinuation,
  encodeAuthContinuation,
  parseAuthFragment,
} from "@/lib/auth-continuation";

const tokenHash = "abcdefghijklmnopqrstuvwxyz_1234567890-ABCDE";

describe("auth continuation", () => {
  it("parses only supported token-hash fragments", () => {
    expect(parseAuthFragment(`#token_hash=${tokenHash}&type=invite`)).toEqual({
      tokenHash,
      type: "invite",
    });
    expect(parseAuthFragment(`#access_token=${tokenHash}&type=invite`)).toBeNull();
    expect(parseAuthFragment(`#token_hash=${tokenHash}&type=signup`)).toBeNull();
    expect(parseAuthFragment(`#token_hash=${tokenHash}&type=magiclink`)?.type).toBe("magiclink");
  });

  it("round-trips the short-lived cookie payload without URLs or passwords", () => {
    const encoded = encodeAuthContinuation({ tokenHash, type: "recovery" });
    expect(encoded).not.toContain("http");
    expect(decodeAuthContinuation(encoded)).toEqual({ tokenHash, type: "recovery" });
  });

  it("rejects malformed cookie state", () => {
    expect(decodeAuthContinuation(undefined)).toBeNull();
    expect(decodeAuthContinuation("invite.short")).toBeNull();
    expect(decodeAuthContinuation(`signup.${tokenHash}`)).toBeNull();
  });
});
