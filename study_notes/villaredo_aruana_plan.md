# Villaredo Aruana — Community App Plan

> A platform for the 900-unit residential complex — connecting owners, centralizing knowledge, and supporting the journey of building our homes.

---

## Starting Point: DocuHub Clone

Rather than building from scratch, this app is based on **DocuHub** — a Confluence-like documentation platform already built and working. This significantly reduces development effort.

**DocuHub stack (already in place):**
- Next.js 16 (App Router) + React 19 + TypeScript
- PostgreSQL + Prisma ORM
- NextAuth 5 (JWT sessions, email/password auth)
- shadcn/ui + Tailwind CSS 4
- Novel/Tiptap rich text editor (slash commands, full formatting)
- Full org/team/roles system
- Tags, favorites, search, activity tracking, comments, reactions

---

## What to Keep from DocuHub (Zero Work)

| Feature | DocuHub Equivalent | Status |
|---|---|---|
| Auth (login/register/sessions) | Full auth system | ✅ Keep as-is |
| Admin panels | Members, teams, roles, clients | ✅ Keep, rename "clients" → repurpose |
| Rich text editor | Novel/Tiptap | ✅ Keep as-is |
| Document spaces | Spaces (ORG_WIDE, TEAM, etc.) | ✅ Keep, rename to Categories |
| Document CRUD + hierarchy | Full doc system | ✅ Keep as-is |
| Tags on documents | Tag system | ✅ Keep as-is |
| Search | Full-text search + history | ✅ Keep as-is |
| Favorites / bookmarks | Favorites system | ✅ Keep as-is |
| Comments & reactions | On documents | ✅ Keep as-is |
| Activity feed | Activity model | ✅ Keep as-is |
| Dark mode | next-themes | ✅ Keep as-is |
| Mobile layout | Sidebar + mobile nav | ✅ Keep, enhance for PWA |

---

## What to Adapt from DocuHub

| DocuHub Concept | Aruana Adaptation | Effort |
|---|---|---|
| **Organization** | Single org = the complex. Remove multi-org setup flow, simplify registration | Low |
| **Teams** | Repurpose as **Sectors/Blocks** (Block A, Block B, Investors group, etc.) | Low |
| **Clients** | Repurpose as **Unit Groups** or remove entirely | Low |
| **OrgRole: OWNER/ADMIN/MEMBER** | Rename OWNER→RESIDENT, keep ADMIN, add MODERATOR | Low |
| **Spaces** | Rename to **Categories**: Construction, Providers, Paperwork, HOA Rules, etc. | Low |
| **SpaceType** | Simplify: remove CLIENT/PERSONAL, keep ORG_WIDE + TEAM (block-scoped) | Low |
| **Org setup page** | Replace with invite-based or admin-approved registration | Medium |
| **Dashboard feed** | Adapt "For You" feed to show docs relevant to user's block/units | Low |

---

## What to Build from Scratch (Net New)

### 1. WhatsApp Chat Import & AI Processing *(highest value, most work)*

**How it works:**
- Admin uploads `.txt` chat export files (WhatsApp → Export Chat → Without Media)
- File is parsed and split into chunks (~100 messages each)
- Each chunk is sent to Claude API to filter noise and extract meaningful content
- Extracted insights are categorized and stored as raw material for doc generation

**Import tracking:**
- Track per import: group name, file name, date range covered, status (PENDING / PROCESSING / DONE / FAILED)
- Prevents re-importing same ranges
- Dashboard: which groups imported, date ranges covered, messages total vs. kept

**AI extraction categories:**
- Construction progress & milestones
- Local service providers & contractors
- Required paperwork (SEFAZ, CREA, prefeitura, cartório)
- Legal / HOA regulations
- Infrastructure (water, sewage, electricity, telecom)
- Tips & FAQs from experienced owners

**New model:**
```
WhatsappImport
  - id, groupName, fileName
  - dateRangeStart, dateRangeEnd
  - status, messagesTotal, messagesKept
  - createdById → User

ExtractedInsight
  - id, importId → WhatsappImport
  - category, content (text)
  - usedInDocId → Document (nullable, once drafted)
```

---

### 2. AI Doc Generation from Extracted Insights

**Flow:**
- After import, admin selects a category and triggers "Generate Document"
- Claude receives all extracted insights for that category and produces a structured Markdown document
- Document is saved as DRAFT in the appropriate Space/Category
- Moderator/Admin reviews, edits with the existing Tiptap editor, and publishes

**Traceability:**
- Document links back to its source `WhatsappImport(s)` via a new `documentSourceImports` relation
- Admins can manually create docs too (already supported by DocuHub)

---

### 3. Unit & Owner Management *(new data layer)*

**Concepts:**
- Each owner has 1+ units (some investors own multiple)
- Admin approves new user registrations and links them to units
- Units have construction status owners can self-update

**New models:**
```
Unit
  - id, number, block, description
  - constructionStatus (LAND | FOUNDATION | STRUCTURE | FINISHING | COMPLETE)
  - ownerId → User (nullable if not yet claimed)
  - listing: UnitListing?

UserUnit (if multi-unit per owner needed)
  - userId → User
  - unitId → Unit
```

**Registration flow change:**
- New users register with name, email, password + unit number
- Account goes to PENDING until admin approves and links to unit
- Admin sees pending registrations in the members panel (adapting existing panel)

---

### 4. Unit Listings (On Sale)

- Owner flags their unit as "On Sale" from their profile
- Optional: set price (visible or hidden)
- Contact preference: show phone, show email, or in-app inbox only
- Public listings page visible to all logged-in users
- Filters: block, price range, construction status
- Contact seller via in-app inbox without exposing their info

**New model:**
```
UnitListing
  - id, unitId → Unit
  - price (optional Float)
  - showPrice Boolean
  - contactPreference (PHONE | EMAIL | INBOX)
  - active Boolean
  - createdAt, updatedAt
```

---

### 5. Inbox & Notifications

**One-to-one messages:**
- Any owner can message another (e.g., about a unit for sale)
- Admins/moderators can message any user

**Broadcasts:**
- Admins send announcements to all users or filtered groups
- Delivered as push notification via OneSignal (PWA)

**Notification types:**
- New inbox message
- Admin announcement
- Document published/updated in your block's space
- Unit listing inquiry received
- Registration approved

**New models:**
```
Message
  - id, fromId → User, toId → User
  - content, readAt, createdAt

Notification
  - id, userId → User
  - type, title, body
  - readAt, createdAt
  - metadata JSON (link, relatedId, etc.)
```

---

### 6. PWA Setup

- `manifest.json` with app name, icon, theme color
- Service worker for offline caching of docs
- OneSignal SDK integration for push notifications
- Add-to-home-screen prompt on mobile
- Full-screen mode (no browser chrome)

This is the distribution strategy — residents already live on their phones and WhatsApp. PWA means zero friction: share a link, they tap "Add to Home Screen", done.

---

### 7. Provider Directory

Community-curated list of local service providers, seeded from WhatsApp import:

- Categories: architect, civil engineer, electrician, plumber, landscaping, fencing, internet, etc.
- Name, phone/contact, neighborhood (local or nearby cities)
- Community notes and endorsements from owners who hired them
- Admins can add/edit; owners can suggest via inbox or comment

**New model:**
```
Provider
  - id, name, category
  - phone, website (optional)
  - notes, endorsedBy: User[]
  - createdById → User
```

---

### 8. Construction Timeline

Admin-maintained complex-wide milestone tracker:

- Key dates: land transfer, infrastructure start/end, utilities availability, etc.
- Status per milestone: planned / in progress / completed
- Owners can see at a glance what's been done and what's next
- Each owner can optionally log their own unit's progress (self-reported)

---

### 9. Community Polls

- Admins create polls with multiple options
- Each unit = 1 vote (regardless of how many units an owner has, or weighted — configurable)
- Deadline for voting
- Results visible after deadline or immediately (admin choice)
- Examples: HOA fee vote, hiring security company, common area decisions

**New models:**
```
Poll
  - id, title, description, closesAt, resultsVisible
  - createdById → User

PollOption
  - id, pollId → Poll, label

PollVote
  - id, pollId → Poll, optionId → PollOption
  - userId → User (unique per poll)
```

---

### 10. Emergency & Important Contacts

Simple admin-managed quick-reference page:
- Complex management
- Prefeitura / CREA / utility companies
- HOA board contacts
- Emergency: fire, SAMU, police
- Local neighborhood security (if any)

---

## Full Data Model Delta (New vs DocuHub)

Models to **keep unchanged**: User, Organization, Session, Space, Document, Comment, Reaction, Favorite, Activity, Tag, Team, TeamMember, Role, UserRole, Client

Models to **add**:

```
Unit, UserUnit, UnitListing
WhatsappImport, ExtractedInsight
Message, Notification
Provider
Poll, PollOption, PollVote
TimelineEvent
EmergencyContact
```

Models to **remove or repurpose**:
- `Client` → repurpose as Unit Group tracker or remove
- `DocumentClient`, `DocumentTeam`, `DocumentRole` → simplify, keep what's useful for block-scoped docs

---

## Roles & Permissions

| Feature | Resident (member) | Moderator | Admin |
|---|---|---|---|
| Read all documentation | ✅ | ✅ | ✅ |
| Edit / publish docs | ❌ | ✅ | ✅ |
| Import WhatsApp chats | ❌ | ❌ | ✅ |
| Generate AI documents | ❌ | ❌ | ✅ |
| Manage own unit listing | ✅ | ✅ | ✅ |
| Manage all listings | ❌ | ✅ | ✅ |
| Send broadcast notifications | ❌ | ✅ | ✅ |
| Inbox (one-to-one) | ✅ | ✅ | ✅ |
| Manage users / approve registrations | ❌ | view | ✅ |
| Manage provider directory | ❌ | ✅ | ✅ |
| Create polls | ❌ | ✅ | ✅ |
| Update construction timeline | ❌ | ❌ | ✅ |
| Manage emergency contacts | ❌ | ❌ | ✅ |

---

## Phased Rollout

### Phase 1 — Clone & Adapt DocuHub (~1–2 weeks)
- [ ] Clone DocuHub, rename project, clean up seed data
- [ ] Simplify org setup → single-org, invite/admin-approve flow
- [ ] Rename roles: OWNER → RESIDENT, add MODERATOR
- [ ] Rename Spaces → Categories, configure for Aruana (Construction, Paperwork, etc.)
- [ ] Repurpose Teams → Blocks/Sectors
- [ ] Add `Unit` + `UserUnit` models, link users to units in admin panel
- [ ] PWA manifest + service worker (offline docs)

### Phase 2 — WhatsApp Import & AI Docs (~1–2 weeks)
- [ ] WhatsApp `.txt` parser (chunked processing)
- [ ] Claude API integration for noise filtering + insight extraction
- [ ] Import tracking dashboard (admin)
- [ ] AI doc generation from extracted insights → saves as DRAFT
- [ ] Admin reviews + edits with existing Tiptap editor → publishes
- [ ] Source traceability (doc ↔ import link)

### Phase 3 — Units & Listings (~1 week)
- [ ] Unit profiles (block, status, owner)
- [ ] Owner self-service: update construction status
- [ ] Unit listing (on sale flag, price, contact prefs)
- [ ] Public listings page with filters
- [ ] Contact via inbox (no info leak)

### Phase 4 — Inbox & Push (~1 week)
- [ ] One-to-one messaging
- [ ] Admin broadcast announcements
- [ ] Notification model + bell icon in header
- [ ] OneSignal integration for push notifications
- [ ] Notification preferences page

### Phase 5 — Community Features (~1–2 weeks)
- [ ] Provider directory (admin-managed + community suggestions)
- [ ] Construction timeline (complex milestones + unit self-reporting)
- [ ] Community polls + voting
- [ ] Emergency contacts page

### Phase 6 — Polish & Launch
- [ ] Mobile UX pass (PWA feel, touch targets, bottom nav)
- [ ] Search across providers + units + docs
- [ ] Onboarding flow for new residents
- [ ] Performance & loading states audit

---

## Tech Stack (Final)

| Layer | Technology | Source |
|---|---|---|
| Framework | Next.js 16 App Router | DocuHub |
| Language | TypeScript | DocuHub |
| Database | PostgreSQL + Prisma | DocuHub |
| Auth | NextAuth 5 (JWT) | DocuHub |
| UI | shadcn/ui + Tailwind 4 | DocuHub |
| Rich Text Editor | Novel / Tiptap | DocuHub |
| AI | Anthropic Claude (claude-sonnet-4-6) | New |
| Push Notifications | OneSignal (free tier) | New |
| File Storage | Supabase Storage or Vercel Blob | New |
| PWA | Web App Manifest + Service Worker | New |

---

## Hosting & Infrastructure Costs

### Recommended (Growth — live community)

| Service | Option | Monthly (USD) | Monthly (BRL) |
|---|---|---|---|
| App Hosting | Vercel Pro | $20 | ~R$114 |
| Database | Supabase Pro | $25 | ~R$142 |
| File Storage | Supabase (included in Pro) | $0 | — |
| Push Notifications | OneSignal Free | $0 | — |
| Domain (.com.br) | Registro.br | ~$0.75 | ~R$4 |
| **Total** | | **~$46/mo** | **~R$262/mo** |

### Budget Starter (while building)

| Service | Option | Monthly (USD) |
|---|---|---|
| App + DB | Railway Starter | $5–20 |
| Push | OneSignal Free | $0 |
| Domain | .com.br | ~$0.75 |
| **Total** | | **~$6–21/mo** |

Start on Railway, move to Vercel Pro + Supabase when you go live with real users.

### Cost Tiers Summary

| Tier | Monthly (USD) | Monthly (BRL) | When |
|---|---|---|---|
| Starter | ~$6–8 | ~R$35–45 | Building / testing |
| Growth | ~$45–50 | ~R$255–285 | Live community |
| Scale | ~$80–100+ | ~R$450–570 | High traffic |

---

## Domain Suggestions

| Domain | Register at | Est. Cost/year |
|---|---|---|
| `villaredo.com.br` | registro.br | ~R$50 (~$9) |
| `aruana.app` | Namecheap / Cloudflare | ~$14 |
| `comunidade-aruana.com.br` | registro.br | ~R$50 |
| `villaredo-aruana.com` | Namecheap / Cloudflare | ~$12 |

Recommendation: register `.com.br` on registro.br — cheapest and the most trusted TLD for Brazilian audiences.

---

*Updated: March 2026 — Based on DocuHub codebase analysis*
