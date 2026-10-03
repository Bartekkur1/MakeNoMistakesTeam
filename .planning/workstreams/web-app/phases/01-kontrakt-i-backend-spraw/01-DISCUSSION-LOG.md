# Phase 1: Kontrakt i backend spraw - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-03
**Phase:** 01-kontrakt-i-backend-spraw
**Areas discussed:** Stack, zapis i adres

---

## Stack, zapis i adres

| Pytanie | Opcje | Wybór |
|---|---|---|
| Gdzie działa API spraw? | Next.js route handlers (rec.) / Osobny serwer Express-Fastify / You decide | Next.js route handlers |
| W czym trzymać dane? | SQLite / Hostowana baza (Supabase/Neon) / Plik JSON | Supabase (wpisane przez użytkownika) |
| Adres na demo? | Vercel (rec.) / Localhost + tunel / Tylko localhost | Heroku (wpisane przez użytkownika) |
| Jak Next.js rozmawia z Supabase? | Tylko serwer, service_role (rec.) / Klienci z anon key + RLS / You decide | Tylko serwer, service_role |
| Zarządzanie schematem? | Migracje SQL w repo (rec.) / Ręcznie w dashboardzie / ORM | Migracje SQL w repo |

**Notes:** Użytkownik nie wybrał do dyskusji obszarów: kształt kontraktu, dostęp/role/CORS, dane przykładowe i reset.

## Claude's Discretion

- Kształt kontraktu (ścieżki, ID, enumy, błędy, filtrowanie)
- Dostęp, role i CORS (bez auth, polling odpowiedzi, chrome-extension origin)
- Dane przykładowe, seed, reset

## Deferred Ideas

Brak.
