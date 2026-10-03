# Czujny Senior (working name)

## What This Is

Polish-language web portal that looks like an ordinary news site, built for seniors to learn to recognise online manipulation and scams. An "intent view" (tryb podglądu intencji) lights up every manipulation, scam ad and fake news item in colour, with a short explanation and a "Czytaj więcej" page per technique. A second part, the endless game "Fake czy nie?", lets seniors practise on mock bank, courier, shop, OLX, ZUS/office, post and SMS pages. Entered in the HackYeah 2026 (Kraków) **Defence** track as a single project; we do not enter CTF or side contests.

The brand name is a placeholder and must be changeable from a single config location.

## Core Value

A senior can "get fooled" safely and immediately see exactly where the trick was. Live-example practice replaces leaflets and lectures.

## Business Context

- **Customer**: Seniors, reached through workshop leaders (library, UTW, senior club) or grandchildren
- **Revenue model**: None (hackathon project)
- **Success metric**: Full 5-step jury demo works live; jury members get fooled by the game and see the trick at once
- **Strategy notes**: Source: HackYeah-2026-brainstorming.pdf (repo root)

## Requirements

### Validated

(None yet — ship to validate)

### Active

**Part 1: news portal with intent view**
- [ ] Portal looks like a normal news site (front page, articles, ads, "zobacz też"); in normal mode nothing arouses suspicion
- [ ] ~10 fictional articles written by us in the style of real techniques; own invented brand, no impersonation of existing media
- [ ] Button toggles intent view: every element (tile, headline, photo, ad, "see also") gets a colour overlay by group: news manipulation, scam, fake news
- [ ] Each highlighted element has an always-visible badge with the technique name (not hover-dependent); colour is backed by an icon/pattern for colour-blind users
- [ ] Click on an element opens a side panel with the technique name, short explanation and a "Czytaj więcej" link; optional one-line hover preview (never required)
- [ ] Some articles are honest and stay "clean" in intent view, so seniors learn to tell manipulation from real information
- [ ] Full article pages; intent view works inside an article, highlighting manipulative paragraphs by group colour with a short technique note in the margin
- [ ] Fake ads placed where real portals put them; highlighted in intent view like tiles, with a "Czytaj więcej" page on the scam
- [ ] Per-technique "Czytaj więcej" subpage with identical layout: (1) what it is in plain language and why it works on emotions, (2) honest vs manipulated version of the same news side by side, (3) 2-3 questions for defending yourself
- [ ] "Zgłoś artykuł": full editor page where anyone (no account) writes an article, marks manipulative paragraphs and picks techniques from a list; submission goes to a moderation queue and appears on the site only after approval
- [ ] Moderator panel at a hidden URL (no login): list of pending submissions, view text and annotations, Accept / Reject

**Part 2: game "Fake czy nie?"**
- [ ] Endless loop: random page shown, senior picks "fake" or "real", then gets a detailed explanation (what was wrong, or why the page is fine, where and how to spot it); next page on demand
- [ ] Mixed pool of mock pages built as HTML/component templates (bank with a doctored URL, courier "pay 1.99 zł", shop, OLX, ZUS/office, post, SMS) plus news items as in Part 1
- [ ] Explanation reuses intent-view mechanics: suspicious spots (URL, odd sender, time pressure) light up on the same page, each with short description and "Czytaj więcej" link to the shared technique subpages
- [ ] Game stats and progress kept in browser localStorage (survive browser restart; no accounts, per-device)

**Add-ons**
- [ ] "Co zrobić, gdy…" step-by-step panic guides: clicked a suspicious link; gave card data or bank password; sent money to a fraudster; fake "bank/police" caller demanded transfer; SMS about a parcel fee; believed and forwarded fake info. Typical steps: call bank and block card/account, restrict PESEL (mObywatel or office), report to police (112), forward SMS to 8080 (CERT Polska), report site at incydent.cert.pl. Help numbers on every page
- [ ] Glossary of manipulations: all "Czytaj więcej" subpages in one index
- [ ] Large-font / high-contrast mode toggle for the visually impaired
- [ ] Materials for workshop leaders: ready workshop script and a printable "how to defend yourself" question card
- [ ] Facts (CERT Polska, police stats, help numbers, PESEL-restriction process) are researched and verified with cited sources during the project

**Content pipeline**
- [ ] Articles, annotations, techniques and game pages are structured data (JSON/Markdown with defined schema) so an AI agent can generate new content from a template and a human reviews it before publishing
- [ ] Portal brand name defined in a single config location so renaming is a one-line change

### Out of Scope

- User accounts, login, auth — decided for now; stats live in localStorage, moderator panel is an unlisted URL
- Mobile/tablet layout — desktop first, tablet later
- "Wyślij to wnuczkowi" (ask a trusted person if something is true) — deferred
- Impersonating real media or real banks/couriers — content is fictional with own brand
- Competing in CTF or side contests — one project, one track
- Technical stack decisions — resolved during research/planning, not in the idea doc

## Context

- Hackathon: HackYeah 2026, Kraków; project submitted to the **Defence** track (disinformation and fraud resilience is the core of the idea)
- Build time is ~24h with a small team, and the whole 5-step jury demo must work live
- Language of the portal: Polish
- Target users are seniors, shown the portal by workshop leaders or grandchildren; the site itself acts as training
- Part 1 and Part 2 share one explanation system (highlight, short description, "Czytaj więcej") and the same technique subpages
- Content volume: ~10 articles plus game pages at launch, easy agent-assisted generation of more
- Content categories: news manipulation (nationality emphasis, clickbait, emotional words, numbers out of context, mismatched photo), scams around news (fake "doctor recommends" ads, celebrity investments, suspicious fundraisers, "you won a prize"), and fully fabricated news
- Moderation is human: the moderator reviews text and annotations before publishing
- Open: whether to build a tablet version later

Planned jury demo:
1. Show an ordinary portal, nothing looks suspicious
2. Turn on intent view; the page lights up, honest articles stay clean
3. Open an article with a highlighted paragraph and go to "Czytaj więcej": honest version beside manipulated
4. Game: jurors judge a bank page with a doctored URL; most get fooled and see the trick immediately
5. Finish with "Co zrobić, gdy…" and the community editor as the route to scaling content

## Constraints

- **Timeline**: ~24h, small team — scope must fit a polished demo slice; seed content via the agent pipeline
- **Track**: Defence — dezinformacja and fraud resilience must stay central
- **Platform**: Desktop web first; no accounts
- **Persistence**: Portal content and moderation queue in a backend with a database (shared across users); game stats only in localStorage
- **Content**: Fictional articles and brand, no impersonation of real media
- **Accessibility**: Large-font/contrast mode; colour never the only signal
- **Branding**: Name is a placeholder and must be changeable in one place

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| One project in the Defence track | Disinformation/fraud resilience is the core idea; no need to bend it to another track | — Pending |
| Intent view with always-visible badge + click side panel (+ optional hover preview) | Hover is unreliable for seniors with reduced mouse precision and does not work on tablet; the badge shows the technique immediately | — Pending |
| Part 1 and Part 2 share one explanation system and technique subpages | One product, less content to write, consistent learning | — Pending |
| No accounts; game stats in localStorage | Persists across browser restarts without auth; keeps scope to ~24h | — Pending |
| Backend with database for content and moderation queue | Community submissions must be shared and durable | — Pending |
| Moderator panel at a hidden URL, no login | Fastest workable moderation given no accounts | — Pending |
| ~10 launch articles, structured content format for agent generation | Realistic for 24h; scaling by agent plus human review | — Pending |
| Game pages as HTML/component templates | Allows interactive highlighting and agent-generated variants | — Pending |
| Research real facts (CERT Polska, police) during the project | Pitch and guides must rest on verified data and numbers | — Pending |
| Working brand name, config-driven | Name undecided; renaming must be trivial | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-10-03 after initialization*
