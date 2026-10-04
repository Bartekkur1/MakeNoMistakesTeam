// Typed infrastructure errors. Route handlers map them to the contract envelope in http.ts.

export class StorageUnavailableError extends Error {
  override name = "StorageUnavailableError";

  constructor(message = "storage unavailable", options?: { cause?: unknown }) {
    super(message, options);
  }
}

export class AuthNotConfiguredError extends Error {
  override name = "AuthNotConfiguredError";

  constructor(message = "auth not configured", options?: { cause?: unknown }) {
    super(message, options);
  }
}
