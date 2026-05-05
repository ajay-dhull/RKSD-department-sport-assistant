# CLAUDE.md — RKSD College AI Assistant

> **RULE:** Is file ko har session shuru hone se PEHLE padho. Kaam khatam hone ke baad UPDATE karo.

---

## Project Overview
**RKSD College Physical Education Department — AI Assistant & Admin Panel**
Stack: Node/Express + React/Vite + Supabase + TailwindCSS + shadcn/ui + Groq (multi-key) / OpenAI

---

## App State (Latest)

| Feature | Status |
|---------|--------|
| AI Chat (voice + text) | ✅ Working |
| AI Intent Analysis (Groq-powered) | ✅ Replaced keyword matching — understands typos/Hinglish |
| Google Search fallback | ✅ Working (triggers only when DB has no data) |
| Session memory | ✅ Fixed — localStorage + frontend history fallback on server restart |
| Main Admin Panel | ✅ Working |
| Head Admin Panel | ✅ Working |
| Achievements section | ✅ Working (needs data added via Admin Panel → Achievements) |
| Syllabus Manager | ✅ Built (needs `syllabus-setup.sql` run in Supabase) |
| Mini Panel (teacher) | ✅ Built |
| Public Updates Board `/updates` | ✅ Working |
| Email subscriptions | ✅ Built (needs EMAIL env vars) |
| HOD permanent entry | ✅ Dr. Gurdeep Bhola — edit only, delete blocked (UI + server) |

---

## ⏳ User Needs To Do

| Task | How |
|------|-----|
| Run `setup.sql` | Supabase SQL Editor → paste → Run |
| Run `syllabus-setup.sql` | Supabase SQL Editor → paste → Run |
| Insert HOD entry | Run SQL below in Supabase SQL Editor |
| Create storage bucket | Supabase → Storage → New Bucket → Name: `updates-files` → Public: ON |
| Set email env vars | `EMAIL_USER`, `EMAIL_PASS` (Gmail App Password), `EMAIL_FROM_NAME` in `.env` |
| Add achievements data | Admin Panel → Achievements → add medals/trophies (AI tab shows empty until this is done) |
| Deploy to Render.com | Connect GitHub repo, set env vars, Build: `npm install && npm run build`, Start: `npm start` |
| UptimeRobot ping | uptimerobot.com → ping Render URL every 5 min (prevents sleep) |

### HOD Insert SQL (run once in Supabase):
```sql
INSERT INTO staff_members (full_name, employee_id, role, designation, qualification, specialization, is_active)
VALUES ('Dr. Gurdeep Bhola', 'HOD-001', 'HOD', 'Head of Department', 'Ph.D. Physical Education', 'Head of Physical Education Department', true)
ON CONFLICT (employee_id) DO UPDATE SET full_name = 'Dr. Gurdeep Bhola', role = 'HOD', designation = 'Head of Department';
```

---

## Key Architecture

### AI Chat Flow (`server/routes.ts`)
1. `POST /api/ask` → `analyzeIntentWithAI()` (Groq llama-3.1-8b-instant — understands typos/Hinglish)
2. Groq returns JSON: `{fetchEvents, fetchStaff, fetchCourses, fetchSchedules, ...}`
3. Smart fetch — only fetches what query needs
4. Tries OpenAI GPT-4o → falls back to `callGroqWithFallback()` (multi-key, 20 keys)
5. If AI says "pata nahi" + not off-topic → SerpAPI Google search
6. **Hard cap:** DB context truncated at 12,000 chars

### Session / Context Memory
- Server: `SessionManager` (in-memory Map, 2 hour timeout)
- Client: `sessionId` stored in `localStorage` (survives page refresh)
- Fallback: Frontend sends last 10 messages (`recentHistory`) with each request — if server session lost (restart), context restored from frontend history

### AI Intent Analysis (`server/query-analyzer.ts`)
- **Primary:** `analyzeIntentWithAI(query)` — calls Groq llama-3.1-8b-instant, returns fetch strategy JSON
- **Fallback:** `keywordFallback()` — regex-based, used if Groq fails
- Understands: typos ("achivments"), Hinglish ("tumhari uplabdhiyan btao"), casual queries

### HOD (Head of Department) Protection
- `staff_members` table: HOD entry has `role = 'HOD'`
- Server (`routes-admin.ts`): DELETE blocked if `role = 'HOD'` → 403 error
- UI (`StaffSection.tsx`): HOD row pinned at top, amber highlight, Crown icon, NO delete button
- AI: Never shows `employee_id` / internal codes to users

### What fetches when:
| Query type | What gets fetched |
|-----------|-------------------|
| Greeting | settings only |
| Staff / HOD asked | staff_members + settings |
| Achievements asked | events table (max 15 rows) |
| Schedule / timing | class_schedules (max 60 rows) |
| Notices / updates | department_updates (max 10 rows) |
| Courses / fees / admission | courses table |
| Syllabus / units / topics | syllabus_courses + course_content |
| General query | courses + settings + departments |

### Updates Flow
- Admin posts via `POST /api/head-admin/updates` → `department_updates` table
- Public reads via `GET /api/updates` → all `is_active=true` rows
- Email sent async via `sendUpdateToSubscribers()`
- Teacher posts via `POST /api/department/:id/updates` (JWT auth)

### Supabase Tables
- `staff_members` — staff list (`role='HOD'` for dept head, protected from delete)
- `events` — achievements/medals/trophies (add via Admin → Achievements)
- `departments` — teacher mini panels
- `department_updates` — all updates/notices
- `email_subscribers` — subscribed emails
- `courses` — course catalog (fees, seats, duration)
- `syllabus_courses` — BSC PE syllabus (24 courses, 6 semesters)
- `course_content` — syllabus units/topics (~184 rows)
- `class_schedules` — timetable
- `college_settings` — general info
- `notices` — official notices

---

## Key Files
| File | Purpose |
|------|---------|
| `setup.sql` | Run in Supabase — creates all main tables |
| `syllabus-setup.sql` | Run in Supabase — syllabus tables + 24 courses |
| `server/routes.ts` | Main chat API, AI context assembly, system prompt |
| `server/query-analyzer.ts` | AI-powered intent analysis (Groq) + keyword fallback |
| `server/session-manager.ts` | In-memory session store (2hr timeout) |
| `server/groq-multi-key.ts` | Groq key rotation (GROQ_API_KEY_1..20) |
| `server/routes-admin.ts` | Staff CRUD (HOD delete blocked), courses, syllabus |
| `server/routes-head-admin.ts` | Head admin: departments, notices, achievements, image upload |
| `server/routes-updates.ts` | Updates CRUD + email subscriptions |
| `server/routes-department.ts` | Teacher panel APIs |
| `server/email-service.ts` | Gmail SMTP via nodemailer |
| `client/src/pages/home.tsx` | Main chat UI — sessionId in localStorage, sends recentHistory |
| `client/src/pages/main-admin.tsx` | Admin panel |
| `client/src/components/admin/StaffSection.tsx` | Staff list — HOD pinned top, no delete for HOD |
| `client/src/pages/mini-panel.tsx` | Teacher mini panel |
| `client/src/pages/updates-board.tsx` | Public updates page `/updates` |

---

## Important Technical Notes

### AI Prompt Rules (system prompt in routes.ts)
- "head kaun hai" → ALWAYS answer department head (Dr. Gurdeep Bhola), NOT college principal
- "principal kaun hai" → college principal
- Achievements empty → say "Abhi koi achievements add nahi ki gayi" — no suggestions/redirects
- Updates/notices queries → NEVER reject as off-topic
- NEVER show employee_id, HOD-001, EMP-xxx codes to users

### Syllabus Table Naming
- `courses` = general catalog (fees, seats) — used by CoursesSection.tsx
- `syllabus_courses` + `course_content` = actual syllabus — SEPARATE tables, do NOT mix

### Staff HOD Protection
- `role = 'HOD'` is the protection flag — do NOT change this to anything else
- Server blocks DELETE, UI hides Delete button — both layers needed

### 42P01 Error
- All Supabase routes handle `error.code === '42P01'` → return empty data, not 500
- Fix: run `setup.sql` in Supabase

### AI Token Overflow Prevention
- NEVER make DB fetches unconditional — always wrap in `if (fetchStrategy.fetchXxx)`
- 12K char cap is final safety net
- New data source → add to `analyzeIntentWithAI` prompt first

---

## Env Vars Needed
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
GROQ_API_KEY_1= ... GROQ_API_KEY_20=
OPENAI_API_KEY=
SERPAPI_KEY=
EMAIL_USER=
EMAIL_PASS=
EMAIL_FROM_NAME=RKSD College Updates
JWT_SECRET=
NODE_ENV=production
```
