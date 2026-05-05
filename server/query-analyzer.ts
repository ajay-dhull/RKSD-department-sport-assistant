/**
 * AI-Powered Query Analyzer
 * Uses Groq to understand user intent (even with typos/Hinglish)
 * Falls back to keyword matching if AI call fails
 */

export interface FetchStrategy {
  fetchCourses: boolean;
  fetchStaff: boolean;
  fetchEvents: boolean;
  fetchNotices: boolean;
  fetchDepartments: boolean;
  fetchSettings: boolean;
  fetchDepartmentData: boolean;
  fetchSchedules: boolean;
  fetchSyllabus: boolean;
  isGreeting: boolean;
  coursesLimit: number;
  staffLimit: number;
  eventsLimit: number;
  noticesLimit: number;
}

// Keep these interfaces for backward compatibility with routes.ts
export interface QueryTopics {
  courses: boolean;
  staff: boolean;
  events: boolean;
  notices: boolean;
  departments: boolean;
  fees: boolean;
  facilities: boolean;
  admissions: boolean;
  schedule: boolean;
  syllabus: boolean;
  general: boolean;
  greeting: boolean;
}

export interface QueryAnalysis {
  topics: QueryTopics;
  entityMentions: Record<string, string>;
  needsDetailedInfo: boolean;
}

/**
 * AI-powered intent analysis using Groq.
 * Understands typos, Hinglish, Roman Hindi, mixed language etc.
 * Returns a FetchStrategy directly (bypasses QueryAnalysis step).
 */
export async function analyzeIntentWithAI(query: string): Promise<FetchStrategy> {
  const defaultStrategy: FetchStrategy = {
    fetchCourses: false,
    fetchStaff: false,
    fetchEvents: false,
    fetchNotices: false,
    fetchDepartments: false,
    fetchSettings: false,
    fetchDepartmentData: false,
    fetchSchedules: false,
    fetchSyllabus: false,
    isGreeting: false,
    coursesLimit: 50,
    staffLimit: 30,
    eventsLimit: 15,
    noticesLimit: 15,
  };

  const prompt = `You are an intent classifier for RKSD College Physical Education Department chatbot.

Analyze the user query below. It may have typos, be in Hinglish (Hindi+English mix), Roman Hindi, or broken English. Understand the MEANING, not just the words.

User query: "${query}"

Return ONLY valid JSON — no explanation, no markdown:
{
  "fetchEvents": <true if asking about achievements, awards, medals, trophies, sports results, uplabdhiyan, jeet, prize, won, competition results>,
  "fetchStaff": <true if asking about teachers, faculty, staff, principal, professor, sir, madam, coach, HOD>,
  "fetchCourses": <true if asking about courses, programs, B.P.Ed, M.P.Ed, degrees, admission, fees, eligibility>,
  "fetchSchedules": <true if asking about class timing, timetable, period, kab class hai, schedule, room>,
  "fetchNotices": <true if asking about notices, announcements, updates, news, circular>,
  "fetchSyllabus": <true if asking about syllabus, units, topics, curriculum, kya padhna hai, subjects, paper>,
  "fetchSettings": <true if asking about college info, address, about, contact, general information>,
  "fetchDepartments": <true if asking about departments, sections, department list>,
  "isGreeting": <true ONLY if it's purely a greeting like hello/hi/namaste with nothing else>
}`;

  try {
    // Collect Groq keys
    const keys: string[] = [];
    for (let i = 1; i <= 20; i++) {
      const k = process.env[`GROQ_API_KEY_${i}`];
      if (k?.trim()) keys.push(k.trim());
    }
    const legacy = process.env.GROQ_API_KEY;
    if (legacy?.trim() && !keys.includes(legacy.trim())) keys.push(legacy.trim());

    if (keys.length === 0) throw new Error("No Groq keys available");

    for (const key of keys) {
      try {
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "llama-3.1-8b-instant",
            messages: [
              { role: "system", content: "You are a JSON-only intent classifier. Return only valid JSON, no other text." },
              { role: "user", content: prompt },
            ],
            max_tokens: 200,
            temperature: 0.1,
          }),
        });

        if (!res.ok) continue;
        const data = await res.json();
        const raw = data.choices?.[0]?.message?.content?.trim() || "";

        // Extract JSON from response
        const jsonMatch = raw.match(/\{[\s\S]*\}/);
        if (!jsonMatch) continue;

        const parsed = JSON.parse(jsonMatch[0]);
        console.log(`🤖 AI Intent Analysis:`, JSON.stringify(parsed));

        const isDetailed = query.length > 40;

        return {
          fetchCourses: !!parsed.fetchCourses,
          fetchStaff: !!parsed.fetchStaff,
          fetchEvents: !!parsed.fetchEvents,
          fetchNotices: !!parsed.fetchNotices,
          fetchDepartments: !!parsed.fetchDepartments,
          fetchSettings: !!parsed.fetchSettings || !!parsed.fetchStaff,
          fetchDepartmentData: !!parsed.fetchDepartments,
          fetchSchedules: !!parsed.fetchSchedules,
          fetchSyllabus: !!parsed.fetchSyllabus,
          isGreeting: !!parsed.isGreeting,
          coursesLimit: isDetailed ? 100 : 50,
          staffLimit: isDetailed ? 50 : 30,
          eventsLimit: isDetailed ? 30 : 15,
          noticesLimit: isDetailed ? 20 : 10,
        };
      } catch {
        continue;
      }
    }
  } catch (err) {
    console.warn("⚠️ AI intent analysis failed, using keyword fallback:", err);
  }

  // Fallback to keyword matching
  console.log("⚡ Using keyword fallback for intent analysis");
  return keywordFallback(query, defaultStrategy);
}

function keywordFallback(query: string, base: FetchStrategy): FetchStrategy {
  const q = query.toLowerCase();
  const strategy = { ...base };

  const greetingWords = ['hello', 'hi', 'namaste', 'namaskar', 'hey', 'hii', 'helo'];
  if (greetingWords.some(w => q.includes(w)) && q.length < 25) {
    strategy.isGreeting = true;
    strategy.fetchSettings = true;
    return strategy;
  }

  if (/achiv|award|medal|trophy|trophie|winner|won|jeeta|jeet|uplabdh|puraskar|prize|competition result|khel mein|sports result/.test(q)) strategy.fetchEvents = true;
  if (/teacher|faculty|staff|principal|sir|madam|professor|coach|hod|lecturer|adhyapak/.test(q)) { strategy.fetchStaff = true; strategy.fetchSettings = true; }
  if (/course|degree|bped|mped|b\.p\.ed|m\.p\.ed|admission|fee|program|eligibility/.test(q)) strategy.fetchCourses = true;
  if (/timing|timetable|schedule|class kab|period|kab baje|class time|room/.test(q)) strategy.fetchSchedules = true;
  if (/notice|announcement|update|circular|news/.test(q)) strategy.fetchNotices = true;
  if (/syllabus|unit|topic|curriculum|padhai|kya padhna|paper|semester subject/.test(q)) strategy.fetchSyllabus = true;
  if (/college ke baare|about college|address|contact|kahan hai|general info/.test(q)) strategy.fetchSettings = true;
  if (/department|dept|vibhag/.test(q)) { strategy.fetchDepartments = true; strategy.fetchDepartmentData = true; }

  // Nothing matched → general query
  const anyFetching = strategy.fetchCourses || strategy.fetchStaff || strategy.fetchEvents ||
    strategy.fetchNotices || strategy.fetchSchedules || strategy.fetchSyllabus;
  if (!anyFetching) {
    strategy.fetchCourses = true;
    strategy.fetchSettings = true;
    strategy.fetchDepartments = true;
  }

  return strategy;
}

// ─── Backward-compat wrappers (still used in routes.ts) ─────────────────────

export function analyzeQueryTopics(query: string): QueryAnalysis {
  const q = query.toLowerCase();
  const topics: QueryTopics = {
    courses: false, staff: false, events: false, notices: false,
    departments: false, fees: false, facilities: false, admissions: false,
    schedule: false, syllabus: false, general: false, greeting: false,
  };

  const greetings = ['hello', 'hi', 'namaste', 'namaskar', 'hey', 'hii'];
  if (greetings.some(g => q.includes(g)) && q.length < 30) { topics.greeting = true; return { topics, entityMentions: {}, needsDetailedInfo: false }; }

  if (/achiv|award|medal|trophy|winner|won|jeeta|uplabdh|puraskar|prize|competition result/.test(q)) topics.events = true;
  if (/teacher|faculty|staff|principal|sir|madam|professor|coach|hod/.test(q)) topics.staff = true;
  if (/course|degree|bped|mped|admission|fee|program/.test(q)) topics.courses = true;
  if (/timing|timetable|schedule|class kab|period|class time/.test(q)) topics.schedule = true;
  if (/notice|announcement|update|circular/.test(q)) topics.notices = true;
  if (/syllabus|unit|topic|curriculum|padhai|kya padhna/.test(q)) topics.syllabus = true;
  if (/department|dept/.test(q)) topics.departments = true;
  if (/fee|fees|cost|payment/.test(q)) { topics.fees = true; topics.courses = true; }
  if (/admission|apply|enroll/.test(q)) { topics.admissions = true; topics.courses = true; }

  const anyTopic = Object.entries(topics).some(([k, v]) => k !== 'general' && k !== 'greeting' && v);
  if (!anyTopic) topics.general = true;

  const needsDetailedInfo = q.length > 50 || /detail|explain|batao|puri|complete/.test(q);
  return { topics, entityMentions: {}, needsDetailedInfo };
}

export function getDataFetchStrategy(analysis: QueryAnalysis): FetchStrategy {
  const isDetailed = analysis.needsDetailedInfo;
  const t = analysis.topics;

  if (t.greeting) return {
    fetchCourses: false, fetchStaff: false, fetchEvents: false, fetchNotices: false,
    fetchDepartments: false, fetchSettings: true, fetchDepartmentData: false,
    fetchSchedules: false, fetchSyllabus: false, isGreeting: true,
    coursesLimit: 50, staffLimit: 30, eventsLimit: 15, noticesLimit: 10,
  };

  return {
    fetchCourses: t.courses || t.fees || t.admissions || t.general,
    fetchStaff: t.staff,
    fetchEvents: t.events,
    fetchNotices: t.notices,
    fetchDepartments: t.departments || t.general,
    fetchSettings: t.staff || t.facilities || t.general,
    fetchDepartmentData: t.departments,
    fetchSchedules: t.schedule,
    fetchSyllabus: t.syllabus || (t.courses && isDetailed),
    isGreeting: false,
    coursesLimit: isDetailed ? 100 : 50,
    staffLimit: isDetailed ? 50 : 30,
    eventsLimit: isDetailed ? 30 : 15,
    noticesLimit: isDetailed ? 20 : 10,
  };
}
