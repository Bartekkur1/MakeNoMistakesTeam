// Internal links shared by the landing page and the panel. Client-safe on purpose: this module
// imports nothing, so a client component can use it without pulling the landing copy (which lists
// the demo accounts) into the browser bundle. content.ts re-exports these for the landing.

export const LOGIN_HREF = "/login";
