# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

- **Start the dev server**: `npm run dev` – Vite with hot‑module replacement.
- **Build for production**: `npm run build` – runs `tsc -b` then Vite bundling.
- **Preview a production build**: `npm run preview` – serves the `dist` folder.
- **Lint**: `npm run lint` – ESLint with the project's TypeScript config.
- **Type‑check only**: `tsc --noEmit` – validates TypeScript without emitting files.
- **Run tests** (if a test framework is added later): `npm test`; for a single test file: `npm test -- <path>`.

## High‑Level Architecture

### Entry Point & Root
- **`src/main.tsx`** – mounts the React app into the DOM and injects Tailwind styles.
- **`src/App.tsx`** – coordinates authentication, settings, UI layout and data flow. It composes many custom hooks and UI components.

### Authentication Layer
- **`src/context/AuthContext.tsx`** – React context exposing auth state and actions.
- **`src/hooks/useAuth.ts`** – handles login/logout against Supabase, persists session in `localStorage`, and validates input.
- **`src/components/LoginModal.tsx`** – modal UI for entering credentials.

### Data Layer (Supabase)
- **`src/lib/supabase.ts`** – creates a Supabase client from environment variables.
- Custom hooks encapsulate all data operations:
  - **`useMembers`** – fetches the list of members.
  - **`useMeterEntries`** – CRUD for electricity meter entries, night‑shift auto‑entry creation, and real‑time updates via Supabase channels. Uses a `membersRef` (via `useRef`) internally so async callbacks always read the latest members list — **do not use the raw `members` prop inside async functions**.
  - **`useMemberTotals`** – aggregates per‑member usage for a selected month. Also uses `membersRef` / `monthRef` for stable async reads.
  - **`useMemberShiftBreakdown`** – detailed day/night shift breakdown per member.
  - **`useMonthlyStats`** – provides month‑level statistics (e.g., totals, cost).
  - **`useSettings`** – reads global app settings such as the per‑unit rate.
  - **`useDarkMode`** – toggles UI dark theme.
  - **`useToast`** – centralised toast notification system.

### UI Components (presentational)
- **Header** – shows role, total units/cost, dark‑mode toggle, and logout/login controls.
- **SummaryBar** – displays aggregated totals for the selected month.
- **MemberCards** – renders a card per member with usage summary.
- **MeterForm** – form for logging opening/closing meters; auto‑creates night‑shift entries when applicable.
- **HistoryTable** – paginated table of all meter entries with edit/delete actions respecting `isEditor`.
- **Charts** – usage trends visualised with Chart.js.
- **Toast**, **LoadingSpinner**, **ViewOnlyNotice** – UI helpers for feedback and state.

### Utilities & Types
- **`src/utils/calculations.ts`** – pure functions (`calculateGrandTotals`, etc.) used throughout the app.
- **`src/utils/formatters.ts`**, **`src/utils/validators.ts`** – helper functions for date/number formatting and input validation.
- **`src/types/app.types.ts`** – central TypeScript interfaces (`Member`, `Role`, `MeterEntry`, etc.).

### Styling
- Tailwind CSS configured via **`tailwind.config.cjs`** and integrated with Vite using `@tailwindcss/vite`.

## Project Conventions

- All files are **TypeScript** and use **React functional components**.
- Business logic lives in **custom hooks** under `src/hooks/`; UI components focus on rendering only.
- Authentication state is provided through a **React context** (`AuthContext`).
- Dates are stored as **UTC ISO strings**; conversion to Indian Standard Time (IST) happens in the UI where required.
- The UI respects the `isEditor` flag to conditionally render editing controls.
- Supabase is the sole backend; queries are performed with the generated client (`src/lib/supabase.ts`).
- Real‑time updates use Supabase's `channel` API (e.g., shift‑breakdown and meter‑entry listeners).
- **Stale closure pattern**: Hooks that accept props (e.g., `members`) and use them inside async functions **must** sync the prop into a `useRef` and read `ref.current` inside async callbacks. This prevents stale closures when props update after the hook initialises.

## README Highlights & ESLint Configuration

- The repository is a **Vite + React + TypeScript** starter.
- It uses `@vitejs/plugin-react` for fast HMR.
- Recommended ESLint extensions (from the README) include `eslint-plugin-react-x` and `eslint-plugin-react-dom`. The project already ships an `eslint.config.js` that can be extended.
- No additional Cursor or Copilot rules were found.

## High‑Level Design (HLD)

The application is a client‑centric single‑page app that communicates directly with Supabase for authentication, data storage, and realtime updates.

```mermaid
flowchart TD
    UI[UI Components] --> Hooks[Custom React Hooks]
    Hooks --> Supabase[Supabase Client]
    Supabase --> DB[(PostgreSQL)]
    Supabase --> Realtime[Realtime Channels]
    Realtime --> UI
```

**Key responsibilities**
1. **Authentication** – Supabase Auth exposed via `AuthContext`.
2. **Data Access** – CRUD operations performed in custom hooks (`useMembers`, `useMeterEntries`, etc.) that call Supabase tables or RPCs.
3. **State Management** – Hook‑level state combined with global React context for UI preferences and toast notifications.
4. **Realtime Sync** – Hooks subscribe to Supabase realtime channels to reflect changes instantly in the UI.
5. **Presentation Layer** – Tailwind‑styled, component‑driven UI keeping rendering separate from data logic.

### Component Interaction Flow
```
User Interaction → UI Component → Hook → Supabase → Realtime Channel → Hook updates → UI refresh
```

## Low‑Level Design (LLD) & Class Diagram

```mermaid
classDiagram
    class AuthContext {
        +user: User | null
        +login(credentials)
        +logout()
    }
    class SupabaseClient {
        +from(table)
        +rpc(fn, params)
        +auth
    }
    class useAuth {
        +login()
        +logout()
        +session
    }
    class useMembers {
        +members: Member[]
        +loading: boolean
        +fetchMembers()
    }
    class useMeterEntries {
        +entries: MeterEntry[]
        +addOpeningMeter()
        +addClosingMeter()
        +deleteEntry()
        +refresh()
    }
    class useMemberTotals {
        +totals: MemberTotal[]
        +refresh()
    }
    class useMemberShiftBreakdown { }
    class useMonthlyStats { }
    class useSettings { }
    class useDarkMode { }
    class useToast { }
    class HistoryTable {
        +render(entries)
        +onEdit(id)
        +onDelete(id)
    }
    class MeterForm {
        +onSubmit(data)
    }
    AuthContext --> SupabaseClient : uses
    useAuth --> AuthContext : consumes
    useMembers --> SupabaseClient : CRUD
    useMeterEntries --> SupabaseClient : CRUD
    useMemberTotals --> SupabaseClient : read member_usage
    HistoryTable --> useMeterEntries : reads
    MeterForm --> useMeterEntries : writes
```

**Database schema (Mermaid ER)**

```mermaid
erDiagram
    MEMBERS {
        uuid id PK "Primary key"
        varchar name
        varchar shift_type
        timestamp created_at
    }
    METER_ENTRIES {
        uuid id PK
        varchar entry_type
        boolean is_auto
        boolean is_weekend
        varchar status
        numeric start_meter
        numeric end_meter
        numeric usage_units
        timestamp opening_at
        timestamp closing_at
        text notes
        numeric rate_per_unit
        timestamp created_at
    }
    MEMBER_USAGE {
        uuid id PK
        uuid member_id FK "→ MEMBERS.id"
        uuid meter_entry_id FK "→ METER_ENTRIES.id"
        numeric units
        numeric cost "GENERATED ALWAYS AS (units * 14)"
        varchar usage_month
    }
    MEMBERS ||--o{ MEMBER_USAGE : has
    METER_ENTRIES ||--o{ MEMBER_USAGE : creates
```

> **Important – `member_usage.cost` is a generated column.**
> It is computed automatically by Postgres as `units * 14`. **Never include `cost` in INSERT payloads** — doing so causes the entire insert to fail with a Postgres error. Only pass `member_id`, `meter_entry_id`, `units`, and `usage_month` when inserting into `member_usage`.
> The helper `buildMemberUsageRows` in `src/utils/calculations.ts` already omits `cost` correctly.

## API Documentation (Supabase Endpoints)

| Table / RPC | HTTP Method | Path (Supabase) | Description |
|-------------|-------------|----------------|-------------|
| `members` | GET | `/rest/v1/members` | List all members. Supports filtering by `role`.
| `meter_entries` | GET | `/rest/v1/meter_entries` | Retrieve meter entries; query params `date_gte`, `date_lte` for range.
| `meter_entries` | POST | `/rest/v1/meter_entries` | Create a new entry. Payload includes `member_id`, `type` (opening/closing), `reading`, `timestamp`.
| `meter_entries` | PATCH | `/rest/v1/meter_entries?id=eq.{id}` | Update a specific entry (e.g., correction).
| `meter_entries` | DELETE | `/rest/v1/meter_entries?id=eq.{id}` | Delete an entry.
| RPC `create_night_shift_entry` | POST | `/rpc/create_night_shift_entry` | Server‑side function that auto‑creates a night‑shift entry at 22:00 IST if none exists.
| RPC `calculate_monthly_totals` | POST | `/rpc/calculate_monthly_totals` | Computes aggregated units and cost for a given month; returns `{memberId, totalUnits, totalCost}`.

All API calls require the `Authorization` header with the Supabase JWT token obtained after login.

## Guidance for Future Claude Instances

1. **Adding data‑driven features** – create a new hook in `src/hooks/` that encapsulates Supabase interaction, then consume it from a component.
2. **Pure calculations** – place them in `src/utils/` and keep them side‑effect‑free.
3. **Extending UI** – follow the existing pattern: small presentational components in `src/components/`, stateful logic in hooks, and keep `App.tsx` thin.
4. **Styling** – prefer Tailwind utility classes; extend `tailwind.config.cjs` only when necessary.
5. **Testing** – if a test framework is introduced, locate tests next to the file they verify (e.g., `Component.test.tsx`).
6. **ESLint** – update `eslint.config.js` for new rule sets; ensure any new files are covered by the `tsconfig.app.json` project reference.
7. **Real‑time behavior** – when adding new tables to Supabase, remember to add a corresponding realtime channel subscription if UI needs live updates.
8. **Generated columns** – always check if a column is `GENERATED ALWAYS AS` before including it in an insert payload. Currently `member_usage.cost` is generated. Sending a value for it causes the insert to fail silently in older code paths.
9. **Async hooks + props** – any hook that receives a prop (e.g., `members: Member[]`) and reads it inside an `async` function must sync the prop to a `useRef` (`membersRef`) and read `membersRef.current` inside the async body. Reading the raw prop risks a stale closure.

## Bug History

### 2026‑05‑21 — `member_usage` not updating on new entries

**Symptoms:** Adding opening/closing meter entries did not create rows in `member_usage`; member cards showed 0 units.

**Root causes (three bugs):**

| # | File | Bug | Fix |
|---|------|-----|-----|
| 1 | `src/utils/calculations.ts` · `buildMemberUsageRows` | Included `cost` in the insert payload. `member_usage.cost` is a `GENERATED ALWAYS AS` column — Postgres rejects the insert entirely. | Removed `cost` from the returned row object. |
| 2 | `src/hooks/useMeterEntries.ts` · `addOpeningMeter` / `addClosingMeter` | Used `members` directly from the closure. If members hadn't loaded when the hook initialised, the async functions operated on `[]`. | Added `membersRef` (`useRef`) synced in a `useEffect`; async functions now read `membersRef.current`. |
| 3 | `src/hooks/useMeterEntries.ts` · `addClosingMeter` | The `member_usage` insert result was not checked — failures were silently swallowed. | Added `if (usageErr) throw usageErr`. |

**Database backfill:** 12 rows were manually inserted via Supabase MCP for the 6 closed entries that had 0 usage rows (entries from 2026‑05‑18 to 2026‑05‑21).
