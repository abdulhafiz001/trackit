# TrackIT — IT Industrial Training Logbook
## Complete Product & Engineering Plan

---

## 1. Product Overview

**App Name: TrackIT**
Tagline: *Your industrial training, organised.*

TrackIT is a web application that helps Nigerian students track and document their Industrial Training (IT/SIWES) period. It replaces the physical logbook with a structured digital experience — complete with AI-assisted daily entries, week navigation, public holiday awareness, and a clean audit trail students and supervisors can reference.

---

## 2. Tech Stack

| Layer | Choice |
|---|---|
| Frontend | Next.js 14 (App Router) |
| Styling | Tailwind CSS + shadcn/ui |
| Database | MongoDB (via Mongoose) |
| Auth | Custom email-based (no password — logbook-style identity) |
| AI Assistance | GitHub Marketplace model via Inference API |
| Session | NextAuth.js (JWT session, email provider) |
| State | React Context + SWR for data fetching |
| Date Logic | date-fns |

---

## 3. Design Direction

### Visual Identity
- **Palette**: Deep navy (`#0F1629`) as the primary surface. Warm white (`#F8F5F0`) for content areas. Electric teal (`#00D4B8`) as the primary accent. Soft amber (`#F59E0B`) for warnings and highlights.
- **Typography**: `Sora` for headings (geometric, authoritative), `DM Sans` for body (readable, modern). Both from Google Fonts.
- **Style**: Editorial meets utility. Think a Notion-meets-Moleskine aesthetic — structured but warm. Cards with subtle shadows, smooth transitions, generous whitespace.
- **Dark-first**: The app defaults to a dark navy theme. A light mode toggle is available.

### Component Philosophy
- All interactive surfaces use shadcn/ui components as the base (Dialog, Drawer, Button, Badge, Calendar, Textarea, etc.)
- Custom components built on top of shadcn primitives for: the week timeline, daily log card, AI suggestion panel, and onboarding steps.
- Micro-animations on every state change: drawer slides, entries fade in, AI suggestion types character-by-character.

---

## 4. Data Models (MongoDB / Mongoose)

### `User`
```
{
  _id: ObjectId,
  email: String (unique, indexed),
  name: String,
  organization: String,         // Company/establishment name
  department: String,           // e.g. "IT Department", "Finance"
  supervisorName: String,
  itDurationWeeks: Number,      // e.g. 24
  startDate: Date,              // The Monday the IT begins
  endDate: Date,                // Calculated: startDate + (weeks * 5 working days)
  createdAt: Date,
  updatedAt: Date
}
```

### `LogEntry`
```
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  date: Date,                   // The calendar date of the entry (noon UTC)
  weekNumber: Number,           // 1-indexed week (calculated from startDate)
  dayOfWeek: String,            // "Monday" | "Tuesday" | ... | "Friday"
  tasks: String,                // The main activity description
  challenges: String,           // Optional: difficulties encountered
  learnings: String,            // Optional: what was learned
  aiGenerated: Boolean,         // Was this AI-assisted?
  status: String,               // "draft" | "saved" | "holiday"
  createdAt: Date,
  updatedAt: Date
}
```

### `PublicHoliday` (seed collection)
```
{
  _id: ObjectId,
  date: Date,
  name: String,                 // e.g. "Independence Day"
  year: Number
}
```

---

## 5. Application Routes (Next.js App Router)

```
/                          → Landing / Login page
/onboarding                → Multi-step setup flow (new users)
/dashboard                 → Main logbook view (current week)
/dashboard/week/[week]     → Historical week view
/api/auth/[...nextauth]    → NextAuth routes
/api/users/check           → POST: check if email exists
/api/users/create          → POST: create new user
/api/entries               → GET: list entries, POST: create/update
/api/entries/[date]        → GET: single day entry
/api/ai/suggest            → POST: AI suggestion endpoint
/api/holidays              → GET: Nigerian public holidays for year
```

---

## 6. User Flows

### 6A. Landing Page (/)

A clean, minimal page with:
- TrackIT logo top-left
- Central card with headline: *"Document your IT journey"*
- A single email input field with a "Continue" button
- Subtle animated background (floating grid lines or noise texture)

**On Submit:**
- Calls `/api/users/check` with the email
- If user exists → creates a session and redirects to `/dashboard`
- If user does not exist → redirects to `/onboarding` with email stored in query/session

No passwords. The email IS the identity. (For a production version, you'd add a magic link OTP. For this version, email alone is sufficient as the logbook is personal and low-stakes.)

---

### 6B. Onboarding Flow (/onboarding)

A multi-step wizard using a progress indicator (shadcn Progress + numbered steps). Steps:

**Step 1 — Personal Details**
- Full name (required)
- Place of IT (company/organization name) (required)
- Department (required)
- Supervisor's name (optional)

**Step 2 — IT Duration**
- Heading: *"How many weeks is your IT?"*
- A large number input or slider (range: 4–52 weeks)
- Helper text: *"Check your school's IT handbook if unsure. Most programs are 24 weeks."*

**Step 3 — Start Date**
- A date picker (shadcn Calendar component)
- Restricted to: Mondays only (other days are disabled)
- If user selects a non-Monday, show inline message: *"IT logbooks typically begin on a Monday. Please select a Monday."*
- Helper text: *"Choose the first working day of your IT placement."*

**Step 4 — Review & Confirm**
- Summary card showing all entered details
- Calculated end date displayed prominently:
  - Display: *"Your IT will run from [Start Date] to [End Date] — [N] weeks."*
  - Logic: `endDate = addWorkingDays(startDate, weeks * 5)`, skipping Saturdays, Sundays, and Nigerian public holidays
- An animated calendar mini-preview showing the weeks
- "Start My Logbook" CTA button

On confirm: POST to `/api/users/create` → session set → redirect to `/dashboard`

---

### 6C. Dashboard (/dashboard)

The main screen. Split into two visual zones:

**Left Panel — Week Navigator (sidebar, collapsible on mobile)**
- App logo at top
- A vertical list of week pills: *Week 1, Week 2, ... Week N*
- Current week highlighted with teal accent
- Completed weeks show a subtle checkmark badge
- Scrollable if week count exceeds viewport
- At the bottom: user avatar/name + settings link

**Right Panel — Daily Logbook View**
- **Week Header**: "Week 12 — 14 Oct to 18 Oct 2024"
- **Day Tabs or Timeline Strip**: Monday through Friday displayed as 5 horizontally arranged day cards
  - Each card shows: day name, date, status badge (Logged / Holiday / Pending / Weekend)
  - Current/selected day is expanded or highlighted
  - Public holidays show a badge: 🔴 "Public Holiday — [Name]"
  - Future days are locked with a "Not yet" state
- **Selected Day Log Card** (below the day strip):
  - Date heading and day name
  - The saved entry text (read-only view) if an entry exists
  - An "Edit" button that opens the drawer modal
  - If no entry exists and it's today or a past working day: "Add Log Entry" button (opens drawer)
  - If it's a holiday: full-width banner with holiday name and an icon

---

### 6D. Log Entry Drawer Modal

Triggered by "Add Log Entry" or "Edit Entry" buttons. Uses a **bottom drawer on mobile**, **right-side drawer on desktop** (shadcn Drawer / Sheet component).

**Drawer contents:**
- **Header**: "Log Entry — [Day], [Date]"
- **Section 1: Tasks Completed** (required)
  - Label: *"What did you work on today?"*
  - A Textarea (min 4 rows, auto-expanding)
  - Below the textarea: an **"✨ AI Suggest"** button (teal, ghost variant)
- **Section 2: Challenges** (optional)
  - Label: *"Any challenges or blockers?"*
  - Smaller textarea
- **Section 3: What I Learned** (optional)
  - Label: *"Key learning from today?"*
  - Smaller textarea
- **Footer actions**:
  - "Save Entry" button (primary, teal)
  - "Cancel" button (ghost)
  - Small label showing: "Week [N], Day [D]"

**AI Suggest Panel** (appears inline below the Tasks textarea when button is clicked):
- A card with animated shimmer/loading state while AI generates
- Shows the AI-generated suggestion in a styled blockquote
- Two buttons: **"Use This"** (fills the textarea) and **"Dismiss"**
- Small disclaimer: *"AI-generated based on your recent entries"*
- Character-by-character typewriter animation as suggestion appears

---

### 6E. Week History View (/dashboard/week/[week])

Clicking any week in the sidebar loads this view — same layout as the dashboard but scoped to that historical week. All days are read-only (unless the user wants to edit a past entry — allow this up to 7 days back, then lock).

---

## 7. AI Suggestion Feature (Detail)

### Trigger
User clicks "✨ AI Suggest" inside the log entry drawer.

### API Route: POST /api/ai/suggest

**Request body:**
```json
{
  "userId": "...",
  "currentDate": "2024-10-15",
  "currentWeek": 4
}
```

**Server-side logic:**
1. Fetch the last 5 saved log entries for the user from MongoDB (most recent first)
2. Extract only the `tasks` field from each entry
3. Construct a prompt:
```
System: You are a helpful assistant for a Nigerian university student doing their Industrial Training (IT/SIWES). Based on their recent daily log entries, suggest what they likely did today. Be specific, professional, and use first-person. Keep it to 3–5 sentences. Write it as if the student is describing their day.

Recent entries:
- [Date]: [tasks text]
- [Date]: [tasks text]
- ...

Today is [Day], [Date]. Suggest a realistic and plausible log entry for today.
```
4. Call GitHub Marketplace model API with the user's API token (stored server-side as env variable)
5. Stream or return the response text
6. Mark `aiGenerated: true` if the user accepts and saves

### GitHub Marketplace Model Setup
- Model: `openai/gpt-4o-mini` or `meta/llama-3-8b-instruct` (whichever the user has access to)
- Endpoint: `https://models.inference.ai.azure.com`
- Auth: Bearer token from `GITHUB_TOKEN` environment variable
- Use the `@azure-rest/ai-inference` SDK or plain fetch

---

## 8. Nigerian Public Holidays Logic

### Seeded List (2024–2030)
Hard-code or seed the following annual Nigerian public holidays into the `PublicHoliday` collection:

| Date | Holiday |
|---|---|
| Jan 1 | New Year's Day |
| May 1 | Workers' Day |
| Jun 12 | Democracy Day |
| Oct 1 | Independence Day |
| Dec 25 | Christmas Day |
| Dec 26 | Boxing Day |
| Variable | Eid el-Fitr (2 days) |
| Variable | Eid el-Kabir (2 days) |
| Variable | Eid el-Maulud |
| Variable | Good Friday |
| Variable | Easter Monday |

The variable Islamic holidays should be precomputed for each year and stored. A seed script (`scripts/seedHolidays.js`) handles populating the collection.

### Runtime Logic
- When rendering any day card, check: is this date in the `PublicHoliday` collection?
- If yes: mark day as `holiday`, disable the entry drawer, show holiday badge
- This check happens server-side when fetching week data

---

## 9. Date Calculation Logic

All handled with `date-fns`:

```js
// Calculate end date
function calculateEndDate(startDate, weeksCount) {
  let workingDaysAdded = 0
  let current = new Date(startDate)
  const totalWorkingDays = weeksCount * 5

  while (workingDaysAdded < totalWorkingDays) {
    current = addDays(current, 1)
    const dow = getDay(current)
    const isWeekend = dow === 0 || dow === 6
    const isHoliday = checkIsNigerianHoliday(current) // DB or preloaded list
    if (!isWeekend && !isHoliday) {
      workingDaysAdded++
    }
  }
  return current
}

// Calculate which week number a date falls in
function getWeekNumber(date, startDate) {
  // Count working days from startDate to date, then divide by 5
}
```

The week number displayed in the sidebar is always relative to `user.startDate`.

---

## 10. Key UI Components (Build List for Agent)

| Component | Description |
|---|---|
| `LandingPage` | Email input, animated background, TrackIT branding |
| `OnboardingWizard` | 4-step progress form, step validation |
| `DatePickerMonday` | shadcn Calendar with non-Monday days disabled |
| `EndDatePreview` | Summary card showing calculated start/end with week count |
| `WeekSidebar` | Vertical week list, active/completed states, collapsible |
| `DayStrip` | 5-day horizontal card row: Mon–Fri with status badges |
| `HolidayBanner` | Full-width holiday indicator card |
| `LogCard` | Read-only entry display with Edit button |
| `EntryDrawer` | shadcn Sheet/Drawer with 3 textarea sections |
| `AISuggestPanel` | Inline suggestion card with typewriter animation |
| `WeekProgressBar` | % of week's days logged (shown at top of day view) |
| `EntryStatusBadge` | Badge: Logged / Holiday / Pending / Locked |

---

## 11. Additional Features (Nice-to-Have, Include in Build)

### 11A. Logbook Completion Stats
At the top of the dashboard, a mini stat row:
- **Total entries logged**: e.g. 47 / 120 days
- **Current week**: Week 10 of 24
- **Streak**: 🔥 5 consecutive days logged
- **Completion %**: Progress bar (teal fill)

### 11B. Export to PDF
A "Download Logbook" button in the dashboard header. Generates a formatted PDF using `react-pdf` or a server-side call to Puppeteer/wkhtmltopdf. The PDF mimics the physical IT logbook format — tabular, one week per page — suitable for school submission.

### 11C. Supervisor Comment Field
Each day entry has an optional "Supervisor's Comment" field (text only). This allows students to transcribe their supervisor's weekly feedback into the digital logbook.

### 11D. Search Entries
A search bar in the sidebar (below week list) that searches full-text across all `tasks` entries. Uses MongoDB text index on the `tasks` field.

### 11E. Empty State Encouragement
When a user hasn't logged for 2+ days, the dashboard shows a warm nudge card: *"You haven't logged since Monday. Pick up where you left off!"* with a "Log Now" CTA.

### 11F. Mobile-First Responsive Design
- On mobile: sidebar becomes a bottom sheet or hamburger drawer
- Day strip becomes horizontally scrollable
- Entry drawer becomes a full-screen bottom sheet
- Week stats collapse into an accordion

---

## 12. Environment Variables

```env
MONGODB_URI=mongodb+srv://...
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=...
GITHUB_TOKEN=ghp_...              # GitHub Marketplace API token
GITHUB_MODEL_NAME=gpt-4o-mini     # or whatever model is used
```

---

## 13. Project File Structure

```
trackit/
├── app/
│   ├── (auth)/
│   │   ├── page.tsx              # Landing / login
│   │   └── onboarding/
│   │       └── page.tsx          # Onboarding wizard
│   ├── dashboard/
│   │   ├── layout.tsx            # Sidebar + main layout
│   │   ├── page.tsx              # Current week view
│   │   └── week/
│   │       └── [week]/
│   │           └── page.tsx      # Historical week view
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── users/
│       │   ├── check/route.ts
│       │   └── create/route.ts
│       ├── entries/
│       │   ├── route.ts          # GET list, POST create/update
│       │   └── [date]/route.ts   # GET single day
│       ├── ai/
│       │   └── suggest/route.ts
│       └── holidays/
│           └── route.ts
├── components/
│   ├── landing/
│   │   └── EmailForm.tsx
│   ├── onboarding/
│   │   ├── StepPersonal.tsx
│   │   ├── StepDuration.tsx
│   │   ├── StepStartDate.tsx
│   │   └── StepReview.tsx
│   ├── dashboard/
│   │   ├── WeekSidebar.tsx
│   │   ├── DayStrip.tsx
│   │   ├── LogCard.tsx
│   │   ├── HolidayBanner.tsx
│   │   ├── StatsRow.tsx
│   │   └── EmptyStateCard.tsx
│   ├── entry/
│   │   ├── EntryDrawer.tsx
│   │   └── AISuggestPanel.tsx
│   └── ui/                       # shadcn/ui components
├── lib/
│   ├── mongodb.ts                # Mongoose connection
│   ├── models/
│   │   ├── User.ts
│   │   ├── LogEntry.ts
│   │   └── PublicHoliday.ts
│   ├── dateUtils.ts              # All date-fns helpers
│   ├── holidays.ts               # Holiday list / checker
│   └── ai.ts                    # GitHub AI API wrapper
├── scripts/
│   └── seedHolidays.ts           # One-time seed script
├── public/
│   └── logo.svg
├── .env.local
└── package.json
```

---

## 14. Onboarding UX Micro-details

- Each step card slides in from the right (Framer Motion or CSS transition)
- Form validation is inline — errors appear below fields as the user types, not on submit
- Step 3 date picker: when user hovers a non-Monday, a tooltip says *"Select a Monday to begin"*
- Step 4 shows an animated count-up for the number of working days calculated
- The "Start My Logbook" button pulses with a subtle glow animation to invite the first click

---

## 15. Dashboard UX Micro-details

- Today's day card in the day strip has a soft pulsing indicator (like a "live" dot)
- When a log is saved, the day card transitions from "Pending" to "Logged" with a green checkmark animation
- The AI Suggest button shows a sparkle icon (`✨`) that spins once on hover
- If it's before 9 AM, the day greeting says *"Good morning"*; if after 5 PM, *"Wrapping up today?"*
- The week sidebar shows a small flame emoji next to the current streak count
- Hovering a week pill shows a tooltip: *"3/5 days logged"*

---

## 16. AI Suggestion UX Details

1. User clicks "✨ AI Suggest"
2. The button disables and shows a spinner with text: *"Analysing your entries..."*
3. An inline card appears below the textarea with animated shimmer
4. Text types in character-by-character (typewriter effect, 30ms delay per char)
5. Once complete: "Use This" button pulses once to draw attention
6. Clicking "Use This": text slides/fades into the textarea above
7. The textarea is now editable — user can refine before saving
8. If AI call fails: show a friendly error: *"AI is taking a break. Try again or write your entry manually."*

---

## 17. Suggested shadcn/ui Components to Install

```bash
npx shadcn@latest add button card input textarea badge
npx shadcn@latest add drawer sheet dialog progress
npx shadcn@latest add calendar popover tooltip
npx shadcn@latest add separator avatar skeleton
npx shadcn@latest add scroll-area tabs
```

---

## 18. Dependencies (package.json additions)

```json
{
  "dependencies": {
    "next": "^14",
    "react": "^18",
    "mongoose": "^8",
    "next-auth": "^4",
    "date-fns": "^3",
    "framer-motion": "^11",
    "@azure-rest/ai-inference": "^1",
    "@azure/core-auth": "^1",
    "swr": "^2",
    "zod": "^3",
    "react-hook-form": "^7",
    "@hookform/resolvers": "^3",
    "clsx": "^2",
    "tailwind-merge": "^2"
  }
}
```

---

## 19. Security & Edge Cases

- All API routes check session via `getServerSession()` — unauthenticated requests return 401
- Users can only read/write their own entries — `userId` is always derived from session, never from client input
- Date validation: entries cannot be created for Saturdays, Sundays, or public holidays (validated server-side)
- Entries cannot be created for future dates beyond today
- Past entries older than 7 days are read-only (enforced in drawer UI and API)
- Rate-limit the `/api/ai/suggest` route: max 10 calls per user per day (store counter in User document or Redis)

---

## 20. Seed Script — Nigerian Holidays (2024–2026 sample)

```js
// scripts/seedHolidays.ts
const holidays = [
  { date: '2024-01-01', name: "New Year's Day", year: 2024 },
  { date: '2024-04-10', name: 'Good Friday', year: 2024 },
  { date: '2024-04-12', name: 'Easter Monday', year: 2024 },
  { date: '2024-04-10', name: 'Eid el-Fitr (Day 1)', year: 2024 },
  { date: '2024-04-11', name: 'Eid el-Fitr (Day 2)', year: 2024 },
  { date: '2024-05-01', name: "Workers' Day", year: 2024 },
  { date: '2024-06-12', name: 'Democracy Day', year: 2024 },
  { date: '2024-06-16', name: 'Eid el-Kabir (Day 1)', year: 2024 },
  { date: '2024-06-17', name: 'Eid el-Kabir (Day 2)', year: 2024 },
  { date: '2024-09-15', name: 'Eid el-Maulud', year: 2024 },
  { date: '2024-10-01', name: 'Independence Day', year: 2024 },
  { date: '2024-12-25', name: 'Christmas Day', year: 2024 },
  { date: '2024-12-26', name: 'Boxing Day', year: 2024 },
  // 2025...
]
```

---

*This document is a complete specification for the TrackIT application. An AI coding agent should be able to implement the full application from this plan without needing additional clarification on core functionality.*
