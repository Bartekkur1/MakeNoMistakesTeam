// readJsonBody must enforce LIMITS.maxBodyBytes on the bytes actually received, not only on the
// declared Content-Length. A chunked body (no Content-Length) larger than the cap gets 413 and
// is never read to the end (CR-01).

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as login } from "@/app/api/auth/login/route";
import { LIMITS } from "@/lib/contract/types";
import { readJsonBody } from "@/lib/server/http";

const encoder = new TextEncoder();

interface StreamProbe {
  stream: ReadableStream<Uint8Array>;
  pulled: () => number;
  cancelled: () => boolean;
}

// A stream that yields `chunk` up to `maxChunks` times (Infinity = never ends) and records
// how many chunks were pulled and whether the consumer cancelled it.
function chunkedStream(chunk: Uint8Array, maxChunks: number): StreamProbe {
  let pulled = 0;
  let cancelled = false;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      if (pulled >= maxChunks) {
        controller.close();
        return;
      }
      pulled += 1;
      controller.enqueue(chunk.slice());
    },
    cancel() {
      cancelled = true;
    },
  });
  return { stream, pulled: () => pulled, cancelled: () => cancelled };
}

function streamRequest(body: ReadableStream<Uint8Array>, path = "/api/auth/login"): Request {
  return new Request(`http://localhost${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body,
    duplex: "half",
  } as RequestInit & { duplex: "half" });
}

function streamOf(parts: Uint8Array[]): ReadableStream<Uint8Array> {
  let index = 0;
  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (index >= parts.length) {
        controller.close();
        return;
      }
      controller.enqueue(parts[index]);
      index += 1;
    },
  });
}

beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("readJsonBody size cap", () => {
  it("answers 413 for a chunked body over the cap without Content-Length and stops reading", async () => {
    const probe = chunkedStream(encoder.encode("x".repeat(1024)), Number.POSITIVE_INFINITY);
    const request = streamRequest(probe.stream);
    expect(request.headers.get("content-length")).toBeNull();

    const result = await readJsonBody(request);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.response.status).toBe(413);
    expect(((await result.response.json()) as { error: { code: string } }).error.code).toBe("payload_too_large");

    // 32 chunks of 1 KB fit the cap exactly; the 33rd crosses it. The stream is cancelled
    // right there instead of being read without end.
    expect(probe.cancelled()).toBe(true);
    expect(probe.pulled()).toBeLessThanOrEqual(LIMITS.maxBodyBytes / 1024 + 2);
  });

  it("answers 413 when the body is larger than a falsely small Content-Length", async () => {
    const probe = chunkedStream(encoder.encode("x".repeat(4096)), 20);
    const request = new Request("http://localhost/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json", "content-length": "10" },
      body: probe.stream,
      duplex: "half",
    } as RequestInit & { duplex: "half" });

    const result = await readJsonBody(request);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(413);
  });

  it("accepts a chunked JSON body of exactly the cap", async () => {
    const prefix = '{"pad":"';
    const suffix = '"}';
    const pad = "x".repeat(LIMITS.maxBodyBytes - prefix.length - suffix.length);
    const raw = encoder.encode(prefix + pad + suffix);
    expect(raw.byteLength).toBe(LIMITS.maxBodyBytes);
    const parts = [raw.slice(0, 1000), raw.slice(1000, 20000), raw.slice(20000)];

    const result = await readJsonBody(streamRequest(streamOf(parts)));
    expect(result.ok).toBe(true);
    if (result.ok) expect((result.value.pad as string).length).toBe(pad.length);
  });

  it("decodes multi-byte UTF-8 characters split across chunks", async () => {
    const raw = encoder.encode(JSON.stringify({ body: "zażółć gęślą jaźń" }));
    // Split inside a two-byte character ("ż" is bytes 11-12 of the encoded text).
    const cut = 12;
    expect(raw[11]).toBe(0xc5);
    const result = await readJsonBody(streamRequest(streamOf([raw.slice(0, cut), raw.slice(cut)])));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.value.body).toBe("zażółć gęślą jaźń");
  });

  it("treats a missing body as invalid JSON", async () => {
    const result = await readJsonBody(new Request("http://localhost/api/auth/login", { method: "POST" }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.response.status).toBe(400);
  });
});

describe("POST /api/auth/login with a chunked body", () => {
  it("answers 413 payload_too_large before authentication for an unbounded stream", async () => {
    const probe = chunkedStream(encoder.encode(" ".repeat(8192)), Number.POSITIVE_INFINITY);
    const res = await login(streamRequest(probe.stream));
    expect(res.status).toBe(413);
    expect(res.headers.get("access-control-allow-origin")).toBe("*");
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe("payload_too_large");
    expect(probe.cancelled()).toBe(true);
  });
});
