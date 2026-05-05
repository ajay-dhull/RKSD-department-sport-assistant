import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChatMessageSchema } from "@shared/schema";
import { z } from "zod";
import { applyPronunciationCorrections } from "./pronunciation-corrections";
import { sessionManager } from "./session-manager";
import { requireAdminAuth, loginAdmin } from "./admin-auth";
import { registerHeadAdminRoutes } from "./routes-head-admin";
import { registerDepartmentRoutes } from "./routes-department";
import { registerAdminRoutes } from "./routes-admin";
import { registerUpdatesRoutes } from "./routes-updates";
import { runDatabaseSetup } from "./db-setup";
import { checkSupabaseConnection } from "./supabase-init";
import { supabase } from "./supabase";
import OpenAI from "openai";
import Groq from "groq-sdk";
import { analyzeQueryTopics, getDataFetchStrategy, analyzeIntentWithAI } from "./query-analyzer";
import { callGroqWithFallback } from "./groq-multi-key";

const askSchema = z.object({
  message: z.string().min(1),
  language: z.string().optional(),
  sessionId: z.string().optional(),
  recentHistory: z.array(z.object({ role: z.string(), content: z.string() })).optional(),
});

const ttsSchema = z.object({
  text: z.string().min(1),
  voiceId: z.string(),
  // ElevenLabs parameters
  modelId: z.string().optional(),
  stability: z.number().optional(),
  similarityBoost: z.number().optional(),
  // Cartesia parameters
  cartesiaModelId: z.string().optional(),
  speed: z
    .union([
      z.enum(["slowest", "slow", "normal", "fast", "fastest"]),
      z.number().min(-1).max(1),
    ])
    .optional(),
  emotions: z.array(z.string()).optional(),
  language: z
    .enum([
      "en",
      "fr",
      "de",
      "es",
      "pt",
      "zh",
      "ja",
      "hi",
      "it",
      "ko",
      "nl",
      "pl",
      "ru",
      "sv",
      "tr",
    ])
    .optional(),
});

// 🟢 Track server start time for uptime measurement
const serverStartTime = new Date();

export async function registerRoutes(app: Express): Promise<Server> {
  // ✅ Updated health route with uptime
  app.get("/api/health", (req, res) => {
    const uptimeSeconds = Math.floor(
      (Date.now() - serverStartTime.getTime()) / 1000,
    );
    console.log(`Health ping - server uptime: ${uptimeSeconds}s`);
    res.status(200).json({
      status: "ok",
      uptimeSeconds,
    });
  });

  // Get chat messages
  app.get("/api/messages", async (req, res) => {
    try {
      const messages = await storage.getChatMessages();
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // 🎓 COLLEGE RELEVANCE CHECKER - Rejects non-college questions
  function isCollegeRelevantQuery(query: string): boolean {
    const lowerQuery = query.toLowerCase();

    // College-related keywords that indicate relevance
    const collegeKeywords = [
      "college", "rksd", "kaithal", "admission", "course", "degree",
      "department", "principal", "faculty", "staff", "teacher", "professor",
      "lecturer", "hostel", "campus", "library", "lab", "sports", "physical",
      "bped", "b.p.ed", "mped", "m.p.ed", "physical education", "fitness",
      "gymnasium", "ground", "playground", "coach", "coaching", "athletics",
      "yoga", "fest", "event", "notice", "announcement", "exam", "semester",
      "year", "class", "timetable", "fee", "scholarship", "placement",
      "naac", "ugc", "university", "affiliation", "accreditation", "student",
      "eligibility", "विश्वविद्यालय", "छात्र", "परीक्षा",
      // Common Hinglish queries that are always department-related
      "update", "updates", "latest", "kuch naya", "koi khabar", "khabar",
      "head", "hod", "incharge", "in-charge", "director",
      "achievement", "achivment", "medal", "trophy", "award",
      "schedule", "timing", "timetable", "syllabus",
      "kya ho raha", "kya chal raha", "batao", "bataiye", "jaankari",
      "कॉलेज",
      "प्रवेश",
    ];

    // Non-college topics that should be rejected
    const nonCollegeKeywords = [
      "prime minister",
      "pm ",
      "president",
      "minister",
      "parliament",
      "modi",
      "rahul",
      "cricket score",
      "match",
      "football",
      "ipl",
      "world cup",
      "player",
      "stock market",
      "sensex",
      "nifty",
      "share price",
      "crypto",
      "bitcoin",
      "weather",
      "temperature",
      "rain",
      "forecast",
      "movie",
      "film",
      "actor",
      "actress",
      "bollywood",
      "recipe",
      "cooking",
      "food recipe",
      "news today",
      "latest news",
      "breaking news",
      "train timing",
      "flight",
      "ticket booking",
      "pm kaun",
      "pradhan mantri",
      "मुख्यमंत्री",
      "prime minister kon",
    ];

    // Greeting patterns are always allowed
    const greetingPatterns = [
      "hello",
      "hi",
      "hey",
      "namaste",
      "namaskar",
      "good morning",
      "good afternoon",
      "good evening",
      "thank",
      "thanks",
      "bye",
      "goodbye",
      "kaise ho",
      "how are you",
      "what is your name",
      "aapka naam",
      "kaun ho",
      "tum kaun",
    ];

    const isGreeting = greetingPatterns.some((p) => lowerQuery.includes(p));
    if (isGreeting) return true;

    // Check if query contains non-college keywords
    const hasNonCollegeKeyword = nonCollegeKeywords.some((k) =>
      lowerQuery.includes(k),
    );
    if (hasNonCollegeKeyword) return false;

    // Check if query contains college keywords
    const hasCollegeKeyword = collegeKeywords.some((k) =>
      lowerQuery.includes(k),
    );
    if (hasCollegeKeyword) return true;

    // For ambiguous queries, allow them (to be safe and not reject valid college questions)
    return true;
  }

  // 🛡️ FALLBACK HEURISTIC CLASSIFIER (when AI fails)
  function fallbackHeuristicClassifier(
    query: string,
  ): "public_info" | "admin_info" | "mixed" | "greeting" {
    const lowerQuery = query.toLowerCase();

    // Greeting patterns
    const greetingPatterns = [
      "hello",
      "hi",
      "hey",
      "namaste",
      "namaskar",
      "good morning",
      "good afternoon",
      "good evening",
      "thank",
      "thanks",
      "dhanyawad",
      "shukriya",
      "bye",
      "goodbye",
      "kaise ho",
      "how are you",
      "what is your name",
      "aapka naam",
      "kaun ho",
    ];

    // Public info patterns (stable data)
    const publicInfoPatterns = [
      "history",
      "itihas",
      "established",
      "founded",
      "kab bana",
      "स्थापना",
      "affiliation",
      "affiliated",
      "university",
      "vishwavidyalaya",
      "location",
      "address",
      "kahan hai",
      "kaha hai",
      "address",
      "naac",
      "ugc",
      "ranking",
      "accreditation",
      "recognition",
      "courses",
      "degree",
      "konse courses",
      "kya courses",
      "hostel",
      "sports",
      "facilities",
      "infrastructure",
      "campus",
      "admission process",
      "kaise admission",
      "eligibility",
      "contact number",
      "phone",
      "email",
    ];

    // Admin info patterns (dynamic data)
    const adminInfoPatterns = [
      "principal",
      "prinsipal",
      "head",
      "director",
      "staff",
      "teacher",
      "faculty",
      "professor",
      "lecturer",
      "event",
      "fest",
      "program",
      "celebration",
      "function",
      "notice",
      "announcement",
      "सूचना",
      "घोषणा",
      "timetable",
      "time table",
      "schedule",
      "class timing",
      "holiday",
      "छुट्टी",
      "chutti",
      "leave",
      "exam",
      "परीक्षा",
      "deadline",
      "last date",
      "hod",
      "department head",
      "dean",
      "today",
      "tomorrow",
      "aaj",
      "kal",
      "upcoming",
      "current",
    ];

    const greetingMatch = greetingPatterns.some((p) => lowerQuery.includes(p));
    const publicMatch = publicInfoPatterns.some((p) => lowerQuery.includes(p));
    const adminMatch = adminInfoPatterns.some((p) => lowerQuery.includes(p));

    if (greetingMatch) return "greeting";
    if (publicMatch && adminMatch) return "mixed";
    if (publicMatch) return "public_info";
    if (adminMatch) return "admin_info";

    // Default to admin_info for unknown queries (safer - checks DB first)
    return "admin_info";
  }

  // 🤖 OPTIMIZED INTENT CLASSIFIER - Uses fast heuristics for better performance
  async function classifyQueryIntent(
    query: string,
    groqApiKey: string,
  ): Promise<"public_info" | "admin_info" | "mixed" | "greeting"> {
    // OPTIMIZATION: Use fast heuristic classifier by default for speed (0ms vs 200-500ms API call)
    // Only use AI classifier for truly ambiguous cases
    console.log("⚡ Using fast heuristic classifier for optimal speed");
    return fallbackHeuristicClassifier(query);

    // AI classifier kept here for future use if needed
    // Uncomment below to enable AI-based classification (adds 200-500ms latency)
    /*
    if (!groqApiKey || groqApiKey.trim() === "") {
      console.warn("⚠️ No Groq API key, using fallback heuristic classifier");
      return fallbackHeuristicClassifier(query);
    }

    try {
      const classificationPrompt = `You are an intelligent query classifier for RKSD College chatbot.

Analyze this user query and classify it into ONE of these categories:

1. "public_info" - Queries about stable/publicly available college information:
   - College history, establishment year, founder
   - Affiliation, university, accreditation, NAAC, UGC
   - Location, address, contact details
   - Available courses list, degree programs
   - Hostel facilities, sports facilities, infrastructure
   - General admission process, eligibility criteria
   - Campus facilities overview
   
2. "admin_info" - Queries about dynamic/frequently changing administrative data:
   - Current principal, staff members, faculty names
   - Current events, upcoming programs, festivals
   - Recent notices, announcements
   - Class timings, timetable, schedules
   - Exam dates, deadlines, admission dates
   - Department heads, current office bearers
   - Today's classes, tomorrow's schedule
   
3. "mixed" - Queries that need BOTH public AND admin information:
   - "Principal ka naam aur college history batao"
   - "Events kab hain aur college kahan hai?"
   - "Staff list aur courses konse available hain?"
   
4. "greeting" - Greetings, casual conversation, thanks:
   - "Hello", "Hi", "Namaste", "Thank you"
   - "How are you", "Kaise ho", "What's your name"
   - "Thanks", "Bye", "Goodbye"

User Query: "${query}"

Respond with ONLY ONE WORD: public_info, admin_info, mixed, or greeting
No explanation needed.`;

      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${groqApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content:
                  "You are a query classifier. Respond with only one word.",
              },
              { role: "user", content: classificationPrompt },
            ],
            model: "llama-3.3-70b-versatile",
            max_tokens: 10,
            temperature: 0.3,
          }),
        },
      );

      if (response.ok) {
        const data = await response.json();
        const classification = (data.choices[0]?.message?.content || "")
          .toLowerCase()
          .trim();

        // Validate and return
        if (
          ["public_info", "admin_info", "mixed", "greeting"].includes(
            classification,
          )
        ) {
          console.log(`✅ AI classifier success: ${classification}`);
          return classification as
            | "public_info"
            | "admin_info"
            | "mixed"
            | "greeting";
        }
      }

      console.warn("⚠️ AI classification failed, using fallback heuristic");
      return fallbackHeuristicClassifier(query);
    } catch (error) {
      console.error(
        "❌ Error in AI intent classification, using fallback heuristic:",
        error,
      );
      return fallbackHeuristicClassifier(query);
    }
    */
  }

  // Ask AI assistant
  app.post("/api/ask", async (req, res) => {
    try {
      const { message, language, sessionId, recentHistory } = askSchema.parse(req.body);

      // Get or create session
      const { sessionId: currentSessionId, session } =
        sessionManager.getOrCreateSession(sessionId);

      // Add user message to session
      sessionManager.addMessage(currentSessionId, "user", message);

      // Store user message in database
      await storage.createChatMessage({
        content: message,
        role: "user",
        language: language || "en",
      });

      const groqApiKey = process.env.GROQ_API_KEY;
      if (!groqApiKey) {
        console.warn("GROQ_API_KEY not found in environment variables");
      }

      // 🎓 CHECK IF QUERY IS COLLEGE-RELEVANT
      console.log(`\n🎓 ===== CHECKING COLLEGE RELEVANCE =====`);
      console.log(`📝 User Query: "${message}"`);

      const isRelevant = isCollegeRelevantQuery(message);
      console.log(`✅ College Relevant: ${isRelevant}`);
      console.log(`=========================================\n`);

      if (!isRelevant) {
        console.log(
          `❌ Query is not college-related, sending polite rejection`,
        );
        const rejectionResponse =
          "Sorry, main sirf RKSD College ke baare mein information provide kar sakta hoon 🎓. Aap mujhse college, courses, admission, facilities, events, ya staff ke baare mein kuch bhi pooch sakte hain. Kripya college se related sawaal puchein!";

        // Add rejection response to session
        sessionManager.addMessage(
          currentSessionId,
          "assistant",
          rejectionResponse,
        );

        // Apply pronunciation corrections
        const correctedResponse =
          applyPronunciationCorrections(rejectionResponse);

        // Store assistant response
        await storage.createChatMessage({
          content: rejectionResponse,
          role: "assistant",
          language: "hi",
        });

        return res.json({
          response: correctedResponse,
          sessionId: currentSessionId,
          serpApiUsed: false,
        });
      }

      // 🧠 HYBRID LAYER MODEL - STEP 1: AI INTENT CLASSIFICATION
      console.log(`\n🤖 ===== AI-POWERED INTENT CLASSIFICATION =====`);
      console.log(`📝 User Query: "${message}"`);

      const queryCategory = await classifyQueryIntent(
        message,
        groqApiKey || "",
      );

      console.log(`🎯 AI Classification Result: ${queryCategory}`);
      console.log(`==============================================\n`);

      // Get college context from static data
      const collegeData = await storage.getCollegeInfo();
      let context = collegeData
        .map((info) => `${info.title}: ${info.content}`)
        .join("\n");

      // 🧠 AI-POWERED QUERY ANALYSIS — understands typos, Hinglish, intent
      console.log(`\n🧠 ===== AI INTENT ANALYSIS =====`);
      console.log(`📝 Query: "${message}"`);
      const fetchStrategy = await analyzeIntentWithAI(message);
      console.log(`\n📦 Fetch Strategy:`, JSON.stringify(fetchStrategy, null, 2));
      console.log(`===================================\n`);

      // Keep queryAnalysis for legacy checks in web-search decision logic below
      const queryAnalysis = analyzeQueryTopics(message);

      // For backward compatibility with verification logic
      const shouldFetchFromDB = Object.values(fetchStrategy).some(
        (v) => v === true,
      );
      const shouldPrioritizeSerpAPI = false; // We always try DB first now
      const primarySource = shouldFetchFromDB
        ? "Smart Database Filtering"
        : "AI Response";

      // 🎯 SMART DATA FETCHING - Only fetch relevant data based on query analysis
      const supabaseData: string[] = [];

      try {
        // Build array of fetch promises based on strategy
        const fetchPromises: Promise<any>[] = [];
        const fetchTypes: string[] = [];

        if (fetchStrategy.fetchDepartments) {
          fetchPromises.push(
            fetch(`http://localhost:5000/api/head-admin/departments`),
          );
          fetchTypes.push("departments");
        }

        if (fetchStrategy.fetchNotices) {
          fetchPromises.push(fetch(`http://localhost:5000/api/public/notices`));
          fetchTypes.push("notices");
        }

        if (fetchStrategy.fetchEvents) {
          fetchPromises.push(fetch(`http://localhost:5000/api/public/events`));
          fetchTypes.push("events");
        }

        if (fetchStrategy.fetchDepartmentData) {
          fetchPromises.push(
            fetch(`http://localhost:5000/api/public/all-departments-data`),
          );
          fetchTypes.push("departmentData");
        }

        if (fetchStrategy.fetchStaff) {
          const staffLimit = fetchStrategy.staffLimit || 20;
          fetchPromises.push(
            Promise.resolve(
              supabase
                .from("staff_members")
                .select(
                  "full_name, designation, role, email, phone, qualification, specialization",
                )
                .limit(staffLimit)
                .order("created_at", { ascending: false }),
            ),
          );
          fetchTypes.push("staff");
        }

        if (fetchStrategy.fetchCourses) {
          const coursesLimit = fetchStrategy.coursesLimit || 100;
          fetchPromises.push(
            Promise.resolve(
              supabase
                .from("courses")
                .select(
                  "course_name, course_code, course_type, duration, fees_per_year, description, eligibility, total_seats, is_active",
                )
                .eq("is_active", true) // Only fetch active courses
                .limit(coursesLimit)
                .order("course_type", { ascending: true }), // Order by type for better categorization
            ),
          );
          fetchTypes.push("courses");
        }

        if (fetchStrategy.fetchSettings) {
          fetchPromises.push(
            Promise.resolve(
              supabase
                .from("college_settings")
                .select("key, value")
                .limit(30)
                .order("updated_at", { ascending: false }),
            ),
          );
          fetchTypes.push("settings");
        }

        if (fetchStrategy.fetchSchedules) {
          fetchPromises.push(
            Promise.resolve(
              supabase
                .from("class_schedules")
                .select("section, day_of_week, start_time, end_time, subject, shift, year, course_name, teacher_name, room_number")
                .order("day_of_week", { ascending: true })
                .limit(100),
            ),
          );
          fetchTypes.push("schedules");
        }

        console.log(`🔄 Fetching data for: ${fetchTypes.join(", ")}`);

        // Execute all fetch promises in parallel
        const results = await Promise.all(fetchPromises);

        // Process results based on fetch types
        let resultIndex = 0;

        for (const fetchType of fetchTypes) {
          const result = results[resultIndex++];

          if (fetchType === "departments") {
            if (result.ok) {
              const { departments } = await result.json();
              if (departments?.length) {
                supabaseData.push("\n\n=== ACTIVE DEPARTMENTS ===");
                departments.forEach((dept: any) => {
                  supabaseData.push(
                    `${dept.name}: ${dept.description || "No description"}`,
                  );
                  if (dept.head_name)
                    supabaseData.push(`  Head: ${dept.head_name}`);
                });
              }
            }
          } else if (fetchType === "notices") {
            if (result.ok) {
              const { notices } = await result.json();
              if (notices?.length) {
                supabaseData.push("\n\n=== LATEST NOTICES ===");
                const noticeLimit = fetchStrategy.noticesLimit || 10;
                notices.slice(0, noticeLimit).forEach((notice: any) => {
                  supabaseData.push(
                    `[${notice.priority.toUpperCase()}] ${notice.title}: ${notice.content}`,
                  );
                });
              }
            }
          } else if (fetchType === "events") {
            if (result.ok) {
              const { events } = await result.json();
              if (events?.length) {
                supabaseData.push("\n\n=== DEPARTMENT ACHIEVEMENTS & AWARDS ===");
                const eventLimit = fetchStrategy.eventsLimit || 15;
                events.slice(0, eventLimit).forEach((event: any) => {
                  const eventDate = event.event_date
                    ? new Date(event.event_date).toLocaleDateString("en-IN")
                    : "";
                  const dateStr = eventDate ? ` (${eventDate})` : "";
                  const loc = event.location ? ` at ${event.location}` : "";
                  supabaseData.push(
                    `🏆 ${event.title}${dateStr}${loc} [${event.event_type}]${event.description ? ": " + event.description : ""}`,
                  );
                });
              }
            }
          } else if (fetchType === "departmentData") {
            if (result.ok) {
              const { departments: deptDataList } = await result.json();
              if (deptDataList?.length) {
                supabaseData.push(
                  "\n\n=== DEPARTMENT-SPECIFIC INFORMATION ===",
                );
                deptDataList.forEach((dept: any) => {
                  supabaseData.push(`\n--- ${dept.name} Department ---`);
                  if (dept.head_name) supabaseData.push(`Head: ${dept.head_name}`);
                  if (dept.contact_email) supabaseData.push(`Email: ${dept.contact_email}`);
                  if (dept.description) supabaseData.push(`About: ${dept.description}`);
                  
                  if (dept.data?.length) {
                    const faculty = dept.data.filter((d: any) => d.data_type === 'faculty');
                    const courses = dept.data.filter((d: any) => d.data_type === 'course');
                    const notices = dept.data.filter((d: any) => d.data_type === 'notice');
                    const labs = dept.data.filter((d: any) => d.data_type === 'lab');
                    
                    if (faculty.length) {
                      supabaseData.push(`Faculty Members (${faculty.length}):`);
                      faculty.slice(0, 5).forEach((f: any) => {
                        const meta = typeof f.metadata === 'string' ? JSON.parse(f.metadata || '{}') : f.metadata || {};
                        supabaseData.push(`  - ${f.title}: ${f.content}${meta.qualification ? ' (' + meta.qualification + ')' : ''}`);
                      });
                    }
                    
                    if (courses.length) {
                      supabaseData.push(`Courses (${courses.length}):`);
                      courses.slice(0, 5).forEach((c: any) => {
                        const meta = typeof c.metadata === 'string' ? JSON.parse(c.metadata || '{}') : c.metadata || {};
                        supabaseData.push(`  - ${c.title}${meta.duration ? ' (' + meta.duration + ')' : ''}`);
                      });
                    }
                    
                    if (notices.length) {
                      supabaseData.push(`Recent Notices (${notices.length}):`);
                      notices.slice(0, 3).forEach((n: any) => {
                        supabaseData.push(`  - ${n.title}: ${n.content.substring(0, 100)}...`);
                      });
                    }
                    
                    if (labs.length) {
                      supabaseData.push(`Labs & Facilities (${labs.length}):`);
                      labs.slice(0, 3).forEach((l: any) => {
                        supabaseData.push(`  - ${l.title}: ${l.content || 'No description'}`);
                      });
                    }
                  }
                });
              }
            }
          } else if (fetchType === "staff") {
            if (!result.error && result.data?.length) {
              supabaseData.push("\n\n=== STAFF MEMBERS ===");
              result.data.forEach((member: any) => {
                const roleLabel = member.role === 'HOD' ? 'Head of Department' : (member.designation || member.role || 'Faculty');
                supabaseData.push(`${member.full_name} — ${roleLabel}`);
                if (member.qualification) supabaseData.push(`  Qualification: ${member.qualification}`);
                if (member.specialization) supabaseData.push(`  Specialization: ${member.specialization}`);
                if (member.email) supabaseData.push(`  Email: ${member.email}`);
                if (member.phone) supabaseData.push(`  Phone: ${member.phone}`);
              });
            }
          } else if (fetchType === "courses") {
            if (!result.error && result.data?.length) {
              // Add intelligent summarization with counts and categories
              const courses = result.data;
              const totalCourses = courses.length;

              // Group by course type for better organization
              const coursesByType: Record<string, any[]> = {};
              courses.forEach((course: any) => {
                const type = course.course_type || "Other";
                if (!coursesByType[type]) {
                  coursesByType[type] = [];
                }
                coursesByType[type].push(course);
              });

              supabaseData.push(
                `\n\n=== AVAILABLE COURSES (Total: ${totalCourses}) ===`,
              );

              // Display courses organized by category
              Object.keys(coursesByType)
                .sort()
                .forEach((type) => {
                  const typeCourses = coursesByType[type];
                  supabaseData.push(
                    `\n[${type} Courses - ${typeCourses.length} available]:`,
                  );

                  typeCourses.forEach((course: any) => {
                    const feeInfo = course.fees_per_year
                      ? ` - ₹${course.fees_per_year}/year`
                      : "";
                    const seatsInfo = course.total_seats
                      ? ` - ${course.total_seats} seats`
                      : "";
                    supabaseData.push(
                      `${course.course_name} (${course.course_code}): ${course.duration}${feeInfo}${seatsInfo}`,
                    );
                    if (course.description) {
                      supabaseData.push(`  Description: ${course.description}`);
                    }
                    if (course.eligibility) {
                      supabaseData.push(`  Eligibility: ${course.eligibility}`);
                    }
                  });
                });
            }
          } else if (fetchType === "schedules") {
            if (!result.error && result.data?.length) {
              const schedules = result.data;
              // Group by section for readable output
              const bySection: Record<string, any[]> = {};
              schedules.forEach((s: any) => {
                const key = s.section || "Unknown Section";
                if (!bySection[key]) bySection[key] = [];
                bySection[key].push(s);
              });
              supabaseData.push("\n\n=== CLASS SCHEDULES / TIMETABLE ===");
              Object.entries(bySection).forEach(([section, classes]) => {
                supabaseData.push(`\nSection ${section}:`);
                classes.forEach((c: any) => {
                  const time = c.start_time && c.end_time ? ` ${c.start_time}–${c.end_time}` : "";
                  const shift = c.shift ? ` (${c.shift} shift)` : "";
                  const course = c.course_name ? ` [${c.course_name}]` : "";
                  const teacher = c.teacher_name ? ` Teacher: ${c.teacher_name}` : "";
                  const yearStr = c.year ? ` Year ${c.year}` : "";
                  const room = c.room_number ? ` Room: ${c.room_number}` : "";
                  supabaseData.push(`  ${c.day_of_week}:${time} — ${c.subject || "No subject"}${shift}${course}${yearStr}${teacher}${room}`);
                });
              });
            }
          } else if (fetchType === "settings") {
            if (!result.error && result.data?.length) {
              supabaseData.push("\n\n=== COLLEGE INFORMATION ===");
              result.data.forEach((setting: any) => {
                let value = setting.value;

                // Handle stringified JSON (values saved via JSON.stringify)
                if (typeof value === "string") {
                  try {
                    value = JSON.parse(value);
                  } catch {
                    // plain string value, push as-is
                    supabaseData.push(`${setting.key}: ${value}`);
                    return;
                  }
                }

                if (typeof value === "object" && value !== null) {
                  if (value.title && value.content) {
                    supabaseData.push(`${value.title}: ${value.content}`);
                  } else if (value.content) {
                    supabaseData.push(`${setting.key}: ${value.content}`);
                  } else if (value.list && Array.isArray(value.list)) {
                    supabaseData.push(
                      `${setting.key}: ${value.list.join(", ")}`,
                    );
                  } else {
                    // Flat object like {principal: "Dr. XYZ", college_full_name: "RKSD College", ...}
                    // Extract each key-value pair as a readable line
                    Object.entries(value).forEach(([k, v]) => {
                      if (v && typeof v === "string" && v.trim()) {
                        const label = k.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
                        supabaseData.push(`${label}: ${v}`);
                      } else if (v !== null && v !== undefined && typeof v === "number") {
                        const label = k.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase());
                        supabaseData.push(`${label}: ${v}`);
                      }
                    });
                  }
                } else if (value !== null && value !== undefined) {
                  supabaseData.push(`${setting.key}: ${value}`);
                }
              });
            }
          }
        }

        // Fetch recent department updates — only when notices/updates asked, or general query
        if (fetchStrategy.fetchNotices || queryAnalysis.topics.general || queryAnalysis.topics.notices) {
          try {
            const { data: recentUpdates } = await supabase
              .from("department_updates")
              .select("update_type, title, content, created_at, departments(name)")
              .eq("is_active", true)
              .order("created_at", { ascending: false })
              .limit(5);

            if (recentUpdates && recentUpdates.length > 0) {
              supabaseData.push("\n\n=== RECENT DEPARTMENT UPDATES & NOTICES ===");
              recentUpdates.forEach((u: any) => {
                const deptName = u.departments?.name || "Administration";
                const date = new Date(u.created_at).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata" });
                const content = u.content?.substring(0, 120) || "";
                supabaseData.push(`[${u.update_type.toUpperCase()}] ${u.title} — ${deptName} (${date}): ${content}`);
              });
            }
          } catch (_) { /* ignore */ }
        }

        // Fetch achievements — only when events/achievements asked
        if (fetchStrategy.fetchEvents || queryAnalysis.topics.events) {
          try {
            const { data: achievements, error: achErr } = await supabase
              .from("events")
              .select("title, event_type, event_date, location, description")
              .eq("is_active", true)
              .order("event_date", { ascending: false })
              .limit(15);

            if (!achErr && achievements && achievements.length > 0) {
              supabaseData.push("\n\n=== DEPARTMENT ACHIEVEMENTS & AWARDS ===");
              achievements.forEach((a: any) => {
                const date = a.event_date ? new Date(a.event_date).toLocaleDateString("en-IN") : "";
                const dateStr = date ? ` (${date})` : "";
                const loc = a.location ? ` at ${a.location}` : "";
                const desc = a.description ? `: ${a.description.substring(0, 100)}` : "";
                supabaseData.push(`🏆 ${a.title}${dateStr}${loc} [${a.event_type || "Achievement"}]${desc}`);
              });
            }
          } catch (_) { /* ignore */ }
        }

        // Fetch class schedules — only when schedule/timetable asked
        if (fetchStrategy.fetchSchedules || queryAnalysis.topics.schedule) {
          try {
            const { data: allSchedules, error: schErr } = await supabase
              .from("class_schedules")
              .select("section, day_of_week, start_time, end_time, subject, shift, year, course_name, teacher_name, room_number")
              .eq("is_active", true)
              .order("year", { ascending: true })
              .order("day_of_week", { ascending: true })
              .limit(60);

            if (!schErr && allSchedules && allSchedules.length > 0) {
              const grouped: Record<string, any[]> = {};
              allSchedules.forEach((s: any) => {
                const key = `${s.course_name || "Unknown Course"} — Year ${s.year || "?"} — Section ${s.section || "?"} (${s.shift || "?"} shift)`;
                if (!grouped[key]) grouped[key] = [];
                grouped[key].push(s);
              });
              supabaseData.push("\n\n=== CLASS SCHEDULES / TIMETABLE ===");
              Object.entries(grouped).forEach(([groupKey, classes]) => {
                supabaseData.push(`\n${groupKey}:`);
                classes.forEach((c: any) => {
                  const time = c.start_time && c.end_time ? ` ${c.start_time}–${c.end_time}` : "";
                  const room = c.room_number ? ` Room: ${c.room_number}` : "";
                  const teacher = c.teacher_name ? ` (${c.teacher_name})` : "";
                  supabaseData.push(`  ${c.day_of_week}:${time} — ${c.subject || "No subject"}${room}${teacher}`);
                });
              });
            }
          } catch (_) { /* ignore */ }
        }

        // Fetch syllabus data — only when query is about syllabus/courses/units
        if (fetchStrategy.fetchSyllabus) {
          try {
            const { data: syllabusCourses } = await supabase
              .from("syllabus_courses")
              .select("semester, course_code, course_name, course_type, theory_credits, practical_credits, total_credits, contact_hours, max_marks")
              .order("semester")
              .order("course_code");

            const { data: syllabusContent } = await supabase
              .from("course_content")
              .select("course_code, section_type, unit_number, unit_title, topics, marks, contact_hours")
              .order("course_code")
              .order("section_type")
              .order("unit_number");

            if (syllabusCourses && syllabusCourses.length > 0) {
              supabaseData.push("\n\n=== BSC PHYSICAL EDUCATION SYLLABUS (Kurukshetra University, NEP 2020) ===");
              const contentByCourse: Record<string, typeof syllabusContent> = {};
              if (syllabusContent) {
                syllabusContent.forEach((c: any) => {
                  if (!contentByCourse[c.course_code]) contentByCourse[c.course_code] = [];
                  contentByCourse[c.course_code]!.push(c);
                });
              }
              const bySemester: Record<string, typeof syllabusCourses> = {};
              syllabusCourses.forEach((c: any) => {
                if (!bySemester[c.semester]) bySemester[c.semester] = [];
                bySemester[c.semester]!.push(c);
              });
              Object.entries(bySemester).forEach(([sem, courses]) => {
                supabaseData.push(`\n[SEMESTER ${sem}]`);
                courses!.forEach((course: any) => {
                  supabaseData.push(`  ${course.course_code} — ${course.course_name} (${course.course_type})`);
                  supabaseData.push(`    Credits: ${course.theory_credits}T + ${course.practical_credits}P = ${course.total_credits} | Hours: ${course.contact_hours}/week | Max Marks: ${course.max_marks}`);
                  const content = contentByCourse[course.course_code];
                  if (content && content.length > 0) {
                    const theory = content.filter((c: any) => c.section_type === "theory_unit");
                    const practical = content.filter((c: any) => c.section_type === "practical_unit");
                    if (theory.length > 0) {
                      theory.forEach((u: any) => {
                        supabaseData.push(`    Theory Unit ${u.unit_number}: ${u.unit_title} (${u.contact_hours || "?"} hrs) — ${u.topics.substring(0, 150)}...`);
                      });
                    }
                    if (practical.length > 0) {
                      practical.forEach((u: any) => {
                        const marks = u.marks ? ` [${u.marks} marks]` : "";
                        supabaseData.push(`    Practical Unit ${u.unit_number}: ${u.unit_title}${marks} — ${u.topics.substring(0, 100)}`);
                      });
                    }
                  }
                });
              });
            }
          } catch (_) { /* ignore */ }
        }

        console.log(`✅ Fetched ${supabaseData.length} lines of relevant data`);

        if (supabaseData.length > 0) {
          let dbText = supabaseData.join("\n");
          // Hard cap: max 12000 chars of DB data to avoid token overflow
          if (dbText.length > 12000) {
            dbText = dbText.substring(0, 12000) + "\n...[data truncated for length]";
            console.log(`⚠️ DB context truncated to 12000 chars`);
          }
          context += "\n" + dbText;
        }
      } catch (supabaseError) {
        console.error("Error fetching Supabase data:", supabaseError);
      }

      // Get current date and time in India timezone
      const now = new Date();
      const indiaTime = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        dateStyle: "full",
        timeStyle: "long",
      }).format(now);
      const todayDate = new Intl.DateTimeFormat("en-IN", {
        timeZone: "Asia/Kolkata",
        year: "numeric",
        month: "long",
        day: "numeric",
        weekday: "long",
      }).format(now);

      // Prepare professional system prompt for quality Hinglish responses
      const systemPrompt = `
You are the official AI Assistant of the Physical Education Department, RKSD College, Kaithal! 🏃‍♂️🎓
Your role is to be a warm, helpful, and professional department representative who assists students, parents, staff, and visitors with accurate information and genuine care.
Your full identity is "Main RKSD College ke Physical Education Department ka Assistant hoon".

🚫 OFF-TOPIC RULE — STRICTLY FOLLOW:
If the user's query is CLEARLY NOT related to RKSD College or its Physical Education Department (e.g., cricket match scores, politics, Bollywood movies, cooking recipes, weather forecast, stock market, other colleges, etc.), respond ONLY with this:
"Main sirf RKSD College ke Physical Education Department se related questions answer kar sakta hoon. Department ke baare mein kuch poochhna ho to zaroor batayein — main madad karne ke liye available hoon! 😊"

IMPORTANT — These queries are ALWAYS valid and must NEVER be rejected as off-topic:
- "koi update hai", "latest news", "kuch naya", "koi khabar" → department updates/notices
- "head kaun hai", "HOD kaun hai", "incharge kaun hai" → department head info
- "kya ho raha hai", "department mein kya chal raha" → general department queries
- Any short/casual query from a student about their college/department
- When in doubt, ANSWER — do not reject.

🏛️ HEAD / HOD RULE — STRICTLY FOLLOW:
When user asks "head kaun hai", "HOD kaun hai", "department head", "incharge kaun hai", "kaun hain head":
- ALWAYS answer about the Physical Education Department Head FIRST (check STAFF MEMBERS section below)
- Do NOT answer about college principal unless user specifically asks "college ka principal" or "principal kaun hai"
- This is a department-specific assistant — "head" means department head by default

📚 COURSE QUERY RULE — STRICTLY FOLLOW:
When a user asks about "courses", "programs", "admission" etc. WITHOUT specifying context:
- If they clearly say "RKSD College mein" or "overall college" → you may search Google for full college course list.
- If they say "department mein", "Physical Education mein", "yahan", or "apke" → check College Information below for department courses only. If not found there, say "Mujhe is baare mein pata nahi hai" so the system can search Google.
- If context is UNCLEAR → ask ONE clarifying question: "Aap hamare Physical Education Department ke courses ke baare mein jaanna chahte hain, ya poore RKSD College ke courses?" Then answer based on their reply.
- NEVER mix up college-wide courses with department-specific courses.

📅 CLASS SCHEDULE / TIMING QUERY RULE — STRICTLY FOLLOW:
When a student asks about class timing/schedule/timetable WITHOUT specifying course + year/semester + section:
- STEP 1: Ask ONE clarifying question ONLY: "Aap konse course mein hain (B.P.Ed / M.P.Ed)? Aur konsa year aur section?"
- STEP 2: Once they answer, check "ALL CLASS SCHEDULES / TIMETABLE" section in College Information below.
- STEP 3: Match their course + year + section and give the EXACT timing with day, time, subject, room number.
- If the data exists in College Information → give it directly. NEVER say "pata nahi" if schedule is in the data.
- If data truly not found after clarification → say "Is course/section ki timing abhi add nahi ki gayi. Teacher se ya department se confirm karein."
- NEVER redirect to Google or "administration se contact karein" for schedule queries — yeh data hamare system mein hoga.

🎤 INTRO RULE — STRICTLY FOLLOW:
- ONLY on the very FIRST user message (when conversation history has NO previous assistant messages): give a ONE LINE intro "Namaste! Main Physical Education Department ka Assistant hoon." then immediately answer their question.
- If ANY previous assistant message exists in history → SKIP intro completely. Go STRAIGHT to answering.
- ABSOLUTE RULE: NEVER start a response with "Main RKSD College...", "Main Physical Education...", "Main ek AI assistant hoon", "Hello! Main...", "Namaste! Main..." or ANY identity/greeting line AFTER the first message. Jump directly to the answer.
- NEVER say "Aapne pucha hai ki..." or repeat/rephrase the user's question back to them.
- NEVER add filler openers like "Bilkul!", "Zaroor!", "Han ji!" before the answer.

CURRENT DATE AND TIME:
Today's Date: ${todayDate}
Current Time: ${indiaTime}
(Use this to answer questions about "today", "tomorrow", "this month", etc.)

College Information (PRIMARY SOURCE - Use this FIRST):
${context}

📖 SYLLABUS RULE:
- College Information mein "BSC PHYSICAL EDUCATION SYLLABUS" section hoga — yeh Kurukshetra University ka official NEP 2020 syllabus hai (6 semesters, 24 courses).
- Jab koi syllabus, units, topics, credits, marks pooche toh PEHLE is section se answer do.
- Semester 1-6 courses: Sem 1 (BPE-101 se 104), Sem 2 (BPE-201 se 204), Sem 3 (BPE-301 se 304), Sem 4 (BPE-401/402/403), Sem 5 (BPE-501 se 504), Sem 6 (BPE-601 se 605).
- Student "1st year" pooche toh Semester 1-2, "2nd year" = Semester 3-4, "3rd year" = Semester 5-6.
- Specific unit topics pooche toh relevant theory/practical unit ka content batao.

🏆 ACHIEVEMENTS RULE:
- College Information mein "DEPARTMENT ACHIEVEMENTS & AWARDS" section hoga — yeh hamare department ke real achievements hain (medals, trophies etc. jo admin ne add kiye hain).
- Jab koi achievements, awards, medals, trophies, uplabdhiyan pooche — PEHLE is section se answer do.
- Agar is section mein koi data nahi hai to sirf itna kaho: "Abhi tak koi achievements admin panel mein add nahi ki gayi hain." — kuch aur mat kaho, koi suggestion mat do.
- Agar data hai toh clearly list karo.

IMPORTANT - Year to Semester Mapping:
When user asks about year-based information, convert to semester:
- "1st year" = 1st Semester OR 2nd Semester
- "2nd year" = 3rd Semester OR 4th Semester  
- "3rd year" = 5th Semester OR 6th Semester
Example: "meri 2nd year ki classes kahan hain?" → Look for "3rd Semester" or "4th Semester" information.

CRITICAL RULE - NEVER MAKE UP INFORMATION:
- If you don't find specific factual information (like names, dates, specific people) in the College Information above, you MUST use EXACTLY one of these phrases: "Mujhe is baare mein pata nahi hai", "is baare mein pata nahi", "jaankari nahi hai", or "I don't know".
- NEVER guess or make up names of principals, founders, staff members, or historical facts.
- NEVER invent dates, years, or specific details that are not in the College Information.
- If asked about specific people and their name is not in College Information, clearly say: "Principal ke baare mein pata nahi hai" or "Mujhe is baare mein pata nahi hai".
- Only answer confidently when the exact information is present above.

🚫 INTERNAL DATA RULE — STRICTLY FOLLOW:
- NEVER reveal internal system codes, IDs, or technical fields to users. These are for backend only:
  employee_id, HOD code, HOD-001, EMP-001, EMP-002, panel_id, department_id, UUID, database ID, record ID, any alphanumeric code like "HOD-001" or "EMP-003"
- If data contains these fields, IGNORE them completely. Do NOT mention them in any response.
- Example of WRONG response: "Dr. Gurdeep Bhola hai, unka HOD code HOD-001 hai."
- Example of CORRECT response: "Dr. Gurdeep Bhola hamare department ke Head of Department hain."

RESPONSE STYLE:
- Short aur seedha jawab do. 1-2 sentences kaafi hain simple questions ke liye.
- Agar data nahi hai toh SIRF itna kaho jo relevant ho — suggestions, "online search karo", "contact karo" mat likho.
- Natural Hinglish mein bolo — jaise ek helpful staff member bolta hai.
- No bullet points, no heavy formatting. Conversational rakho.
- Emojis bilkul kam (1 max).
- NEVER start with "Bilkul!", "Zaroor!", "Han ji!", "Aapne pucha hai ki..."
- Directly answer karo — bakwaas nahi.

CRITICAL RESPONSE QUALITY RULES:
- Give SHORT answers by default. If user asks for "full list" or "complete details" then give all info.
- For simple questions (names, timings, location etc) → 1-2 sentences max.
- For course/staff lists → give count + top 2-3 examples, offer more details if they ask.
- Be SPECIFIC - avoid vague responses like "bahut courses hain" — give the count at least.
- If the data shows total count, mention it briefly.

Style Examples (NOTE: These show responses AFTER first message — no identity line):
- User: Namaste
- Assistant: Namaste! 👋 Aap kaise hain? Kya madad kar sakta hoon?

- User: Courses konse available hain Physical Education mein?
- Assistant: B.P.Ed aur M.P.Ed programs available hain! 🎓 B.P.Ed undergraduate hai aur M.P.Ed postgraduate. Fees ya eligibility ke details chahiye?

- User: Faculty kaun hai department mein?
- Assistant: Department mein qualified faculty hain jo sports science aur physical training mein expert hain. Poori list chahiye toh batayein.`;

      let assistantResponse =
        "Namaste! Main RKSD College ke Physical Education Department ka Assistant hoon. Aapki kya madad kar sakta hoon?";
      let serpApiUsed = false;

      try {
        // Get conversation history with context
        let conversationMessages = sessionManager.getConversationHistory(
          currentSessionId,
          systemPrompt,
        );

        // If server session has only current message (session was lost on restart),
        // restore context from frontend's recentHistory
        const sessionMsgCount = conversationMessages.length - 1; // exclude system prompt
        if (sessionMsgCount <= 1 && recentHistory && recentHistory.length > 1) {
          console.log(`🔄 Session restored from frontend history (${recentHistory.length} messages)`);
          conversationMessages = [
            { role: 'system', content: systemPrompt },
            ...recentHistory,
          ];
        }

        console.log(
          `Session ${currentSessionId}: Sending ${conversationMessages.length} messages to LLM (OpenAI GPT-4o → Groq fallback)`,
        );

        // PRIMARY: Try OpenAI GPT-4o first
        try {
          console.log('🤖 Campus Assistant: Trying OpenAI GPT-4o...');
          const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
          });

          const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: conversationMessages as any[],
            temperature: 0.7,
            max_completion_tokens: 500,
          });

          assistantResponse = completion.choices[0]?.message?.content || assistantResponse;
          console.log('✅ OpenAI GPT-4o Success');

        } catch (openaiError: any) {
          // FALLBACK: Use Groq if OpenAI fails
          console.warn('⚠️ OpenAI GPT-4o failed, falling back to Groq...', openaiError.message);

          try {
            const groqResult = await callGroqWithFallback(conversationMessages, {
              model: "llama-3.3-70b-versatile",
              max_tokens: 500,
              temperature: 0.7,
            });
            assistantResponse = groqResult.content || assistantResponse;
            console.log(`✅ Groq Llama Success (Fallback) via key #${groqResult.keyIndex}`);
          } catch (groqErr: any) {
            console.error('❌ Both OpenAI and all Groq keys failed:', groqErr.message);
            assistantResponse = "Khed hai, main abhi technical difficulties ka samna kar raha hoon. Kripya thodi der baad try karein!";
          }
        }

        if (true) { // Keep existing logic structure

          const lowercaseResponse = assistantResponse.toLowerCase();
          // Precise "no info" detection — only clear "I don't know" phrases
          // Intentionally excludes broad words like "sorry", "khed hai", "mere paas", "maaf kijiye"
          // which appear in normal polite responses and would cause false Google search triggers
          const indicatesNoInfo =
            lowercaseResponse.includes("mujhe nahi pata") ||
            lowercaseResponse.includes("mujhe iska pata nahi") ||
            lowercaseResponse.includes("jaankari nahin") ||
            lowercaseResponse.includes("jaankari nahi") ||
            lowercaseResponse.includes("jankari nahi") ||
            lowercaseResponse.includes("information nahi hai") ||
            lowercaseResponse.includes("information available nahi") ||
            lowercaseResponse.includes("i don't know") ||
            lowercaseResponse.includes("i don't have this information") ||
            lowercaseResponse.includes("mujhe samajh nahi") ||
            lowercaseResponse.includes("pata nahi hai") ||
            lowercaseResponse.includes("jaankari nahi hai") ||
            lowercaseResponse.includes("mujhe nahi malum") ||
            lowercaseResponse.includes("is baare mein pata nahi") ||
            lowercaseResponse.includes("ke baare mein information nahi") ||
            lowercaseResponse.includes("ke baare mein pata nahi") ||
            lowercaseResponse.includes("nahi bata sakta") ||
            lowercaseResponse.includes("mere paas yeh jaankari nahi") ||
            lowercaseResponse.includes("mere paas is baare mein") ||
            lowercaseResponse.includes("is information ke baare mein");

          // 🌐 NEW WEB SEARCH MODEL: DATABASE FIRST, SERPAPI ONLY AS BACKUP
          // For ALL queries (public_info, admin_info, mixed):
          // - Database is ALWAYS checked first (already done above)
          // - SerpAPI is ONLY used if AI indicates it doesn't have info from database
          let shouldSearchWeb = false;

          // 🏫 INTERNAL QUERY DETECTION
          // These are department-internal topics that Google cannot help with.
          // Never search web for these — the answer lives only in our admin panel.
          const internalKeywords = [
            // Timing / Schedule
            "timing", "timetable", "time table", "schedule", "class schedule",
            "class timing", "period", "lecture timing", "samay", "time",
            "kab class", "class kab", "kab hai class", "class kahan", "kahan class",
            "kab aata", "kab aate", "kab aati", "kis time", "kab timing",
            "kon se time", "kaun se time", "kitne baje", "baje class",
            // Duty / Location
            "duty", "duty location", "duty chart", "duty roster", "roster",
            "ground", "gym", "sports ground", "field", "playground",
            "room", "classroom", "class room", "room number", "room no",
            "location", "kahan hain", "kahan hai", "kahan pe", "kahaan",
            // Staff / Teacher
            "teacher", "faculty", "staff", "instructor", "coach",
            "sir", "madam", "professor", "dr.", "department head",
            "kaun padhata", "kaun padhata hai", "kaun hai", "kaun hain",
            "adhyapak", "shikshak", "sir ka", "madam ka", "teacher ka",
            "hod", "head of department", "incharge",
            // Subject / Class
            "subject", "subjects taught", "which class", "kon si class",
            "kaunsi class", "konsa subject", "kaun sa subject",
            "1st year", "2nd year", "3rd year", "first year", "second year", "third year",
            "semester", "1st sem", "2nd sem", "3rd sem", "4th sem", "5th sem", "6th sem",
            "section", "batch", "group",
            // Notices / Internal announcements
            "notice", "circular", "announcement", "exam schedule",
            "holiday", "leave", "present", "absent", "attendance",
            "mini panel", "department panel",
          ];
          const lowerMsg = message.toLowerCase();
          // Also skip web search if AI gave the "off-topic / not RKSD related" response
          const isOffTopicResponse = assistantResponse.toLowerCase().includes("main sirf rksd college") ||
            assistantResponse.toLowerCase().includes("sirf rksd college ke");
          const isInternalQuery = internalKeywords.some(kw => lowerMsg.includes(kw));

          if (queryCategory === "greeting") {
            shouldSearchWeb = false;
            console.log(`👋 Greeting - No web search needed`);
          } else if (isInternalQuery) {
            shouldSearchWeb = false;
            console.log(`🏫 Internal department query — skipping Google search (only admin panel can answer this)`);
          } else if (isOffTopicResponse) {
            shouldSearchWeb = false;
            console.log(`🚫 Off-topic query (not RKSD related) — skipping Google search`);
          } else {
            // Admin panel is PRIMARY — always checked first (done above).
            // If AI still says it doesn't know (after checking admin data), fall back to Google.
            shouldSearchWeb = indicatesNoInfo;
            if (indicatesNoInfo) {
              console.log(
                `📊 Admin panel checked (${supabaseData.length} lines) but specific info missing - Using Google SerpAPI as backup`,
              );
            } else {
              console.log(
                `✅ Admin panel has the info (${supabaseData.length} lines) - No Google search needed`,
              );
            }
          }

          console.log(`\n🔍 ===== WEB SEARCH DECISION =====`);
          console.log(
            `📝 AI Response: "${assistantResponse.substring(0, 100)}..."`,
          );
          console.log(`❓ AI indicates no info: ${indicatesNoInfo}`);
          console.log(`📊 Query Category: ${queryCategory}`);
          console.log(`🗄️ Admin panel data lines: ${supabaseData.length}`);
          console.log(`🌐 Should search web: ${shouldSearchWeb}`);
          console.log(`==================================\n`);

          if (shouldSearchWeb) {
            try {
              console.log(`\n🔍 ===== STARTING SERPAPI SEARCH =====`);
              console.log(`❓ Original question: "${message}"`);
              console.log(
                `🤖 AI said it doesn't know, initiating web search...`,
              );

              const serpApiKey = process.env.SERPAPI_API_KEY;

              if (serpApiKey) {
                const searchQuery = `${message} RKSD College Kaithal`;
                const serpApiUrl = `https://serpapi.com/search?engine=google&q=${encodeURIComponent(searchQuery)}&api_key=${serpApiKey}&hl=en`;

                console.log(`🔎 Search query: "${searchQuery}"`);
                console.log(`📡 Calling SerpApi...`);
                const searchResponse = await fetch(serpApiUrl);

                if (searchResponse.ok) {
                  const searchData = await searchResponse.json();
                  let searchInfo = "";

                  if (searchData.ai_overview) {
                    console.log("✅ AI Overview found!");
                    let aiOverview = searchData.ai_overview;

                    if (aiOverview.page_token) {
                      console.log(
                        "🔄 AI Overview requires page_token follow-up, making additional request...",
                      );
                      const followUpUrl = `https://serpapi.com/search.json?engine=google_ai_overview&page_token=${aiOverview.page_token}&api_key=${serpApiKey}`;

                      try {
                        const followUpResponse = await fetch(followUpUrl);
                        if (followUpResponse.ok) {
                          const followUpData = await followUpResponse.json();
                          if (followUpData.ai_overview) {
                            aiOverview = followUpData.ai_overview;
                            console.log(
                              "✅ Successfully retrieved AI Overview from follow-up request",
                            );
                          } else {
                            console.log(
                              "⚠️ Follow-up request did not contain ai_overview",
                            );
                          }
                        } else {
                          console.log(
                            "⚠️ Follow-up request failed:",
                            followUpResponse.status,
                          );
                        }
                      } catch (followUpError) {
                        console.error(
                          "❌ Error in follow-up request:",
                          followUpError,
                        );
                      }
                    }

                    if (
                      aiOverview.text_blocks &&
                      Array.isArray(aiOverview.text_blocks)
                    ) {
                      const textParts: string[] = [];

                      const processListItems = (
                        items: any[],
                        depth: number = 0,
                      ) => {
                        items.forEach((item: any) => {
                          const indent = "  ".repeat(depth);
                          const listItem = [];

                          if (item.title) listItem.push(item.title);
                          if (item.snippet) listItem.push(item.snippet);

                          if (listItem.length > 0) {
                            textParts.push(indent + "• " + listItem.join(": "));
                          }

                          if (item.list && Array.isArray(item.list)) {
                            processListItems(item.list, depth + 1);
                          }
                        });
                      };

                      aiOverview.text_blocks.forEach((block: any) => {
                        if (
                          block.type === "paragraph" ||
                          block.type === "heading"
                        ) {
                          if (block.snippet) {
                            textParts.push(block.snippet);
                          }
                        } else if (
                          block.type === "list" &&
                          block.list &&
                          Array.isArray(block.list)
                        ) {
                          processListItems(block.list);
                        } else if (
                          block.type === "table" &&
                          block.table &&
                          Array.isArray(block.table)
                        ) {
                          textParts.push("\nTable:");
                          block.table.forEach((row: any[], idx: number) => {
                            if (Array.isArray(row)) {
                              textParts.push(row.join(" | "));
                            }
                          });
                        } else if (block.snippet) {
                          textParts.push(block.snippet);
                        }
                      });

                      searchInfo = textParts.filter(Boolean).join("\n");
                      console.log(
                        "✅ AI Overview text extracted:",
                        searchInfo.substring(0, 200) + "...",
                      );
                    }

                    if (
                      aiOverview.references &&
                      Array.isArray(aiOverview.references)
                    ) {
                      const sources = aiOverview.references
                        .slice(0, 3)
                        .map(
                          (ref: any) => `${ref.title || "Source"}: ${ref.link}`,
                        )
                        .filter(Boolean)
                        .join("\n");
                      if (sources) {
                        searchInfo += `\n\nReferences:\n${sources}`;
                      }
                    }
                  }

                  // If no AI Overview in English, try Hindi search for detailed results
                  if (
                    !searchInfo &&
                    searchData.organic_results &&
                    searchData.organic_results.length > 0
                  ) {
                    console.log(
                      "⚠️ No AI Overview in English, trying Hindi search for better results...",
                    );

                    // Try searching in Hindi to get Hindi AI Overview which often has more details
                    const hindiSearchQuery = `${message} RKSD College Kaithal`;
                    const hindiSerpApiUrl = `https://serpapi.com/search?engine=google&q=${encodeURIComponent(hindiSearchQuery)}&api_key=${serpApiKey}&hl=hi&gl=in`;

                    try {
                      console.log(
                        `🔎 Trying Hindi search: "${hindiSearchQuery}"`,
                      );
                      const hindiSearchResponse = await fetch(hindiSerpApiUrl);

                      if (hindiSearchResponse.ok) {
                        const hindiSearchData =
                          await hindiSearchResponse.json();

                        if (hindiSearchData.ai_overview) {
                          console.log("✅ Hindi AI Overview found!");
                          let hindiAiOverview = hindiSearchData.ai_overview;

                          // Handle page_token if needed
                          if (hindiAiOverview.page_token) {
                            console.log(
                              "🔄 Hindi AI Overview requires page_token follow-up...",
                            );
                            const followUpUrl = `https://serpapi.com/search.json?engine=google_ai_overview&page_token=${hindiAiOverview.page_token}&api_key=${serpApiKey}`;

                            try {
                              const followUpResponse = await fetch(followUpUrl);
                              if (followUpResponse.ok) {
                                const followUpData =
                                  await followUpResponse.json();
                                if (followUpData.ai_overview) {
                                  hindiAiOverview = followUpData.ai_overview;
                                  console.log(
                                    "✅ Successfully retrieved Hindi AI Overview",
                                  );
                                }
                              }
                            } catch (err) {
                              console.error("❌ Hindi follow-up error:", err);
                            }
                          }

                          // Extract Hindi AI Overview text
                          if (
                            hindiAiOverview.text_blocks &&
                            Array.isArray(hindiAiOverview.text_blocks)
                          ) {
                            const textParts: string[] = [];

                            const processListItems = (
                              items: any[],
                              depth: number = 0,
                            ) => {
                              items.forEach((item: any) => {
                                const indent = "  ".repeat(depth);
                                const listItem = [];

                                if (item.title) listItem.push(item.title);
                                if (item.snippet) listItem.push(item.snippet);

                                if (listItem.length > 0) {
                                  textParts.push(
                                    indent + "• " + listItem.join(": "),
                                  );
                                }

                                if (item.list && Array.isArray(item.list)) {
                                  processListItems(item.list, depth + 1);
                                }
                              });
                            };

                            hindiAiOverview.text_blocks.forEach(
                              (block: any) => {
                                if (
                                  block.type === "paragraph" ||
                                  block.type === "heading"
                                ) {
                                  if (block.snippet) {
                                    textParts.push(block.snippet);
                                  }
                                } else if (
                                  block.type === "list" &&
                                  block.list &&
                                  Array.isArray(block.list)
                                ) {
                                  processListItems(block.list);
                                } else if (
                                  block.type === "table" &&
                                  block.table &&
                                  Array.isArray(block.table)
                                ) {
                                  textParts.push("\nTable:");
                                  block.table.forEach((row: any[]) => {
                                    if (Array.isArray(row)) {
                                      textParts.push(row.join(" | "));
                                    }
                                  });
                                } else if (block.snippet) {
                                  textParts.push(block.snippet);
                                }
                              },
                            );

                            searchInfo = textParts.filter(Boolean).join("\n");
                            console.log(
                              "✅ Hindi AI Overview text extracted:",
                              searchInfo.substring(0, 300) + "...",
                            );
                          }
                        }
                      } else {
                        console.log(
                          "⚠️ Hindi search response not OK:",
                          hindiSearchResponse.status,
                        );
                      }
                    } catch (hindiSearchError) {
                      console.error(
                        "❌ Hindi search failed:",
                        hindiSearchError,
                      );
                    }
                  }

                  // FINAL FALLBACK: If still no searchInfo after trying both English and Hindi AI Overview, use English organic results
                  if (
                    !searchInfo &&
                    searchData.organic_results &&
                    searchData.organic_results.length > 0
                  ) {
                    console.log(
                      "⚠️ No AI Overview in English or Hindi, falling back to English organic results as last resort",
                    );
                    searchInfo = searchData.organic_results
                      .slice(0, 3)
                      .map((item: any) => `${item.title}: ${item.snippet}`)
                      .join("\n");
                    console.log(
                      "📊 Using organic results:",
                      searchInfo.substring(0, 200) + "...",
                    );
                  }

                  if (searchInfo) {
                    console.log(
                      "Found information, regenerating response with search data",
                    );
                    console.log(
                      "📊 Google AI Overview data:",
                      searchInfo.substring(0, 300) + "...",
                    );

                    // 🎯 CRITICAL FIX: Put Google AI Overview data FIRST, then database context as secondary reference only
                    const enhancedContext = `=== 🔍 GOOGLE AI OVERVIEW (PRIMARY SOURCE - USE THIS FIRST) ===
${searchInfo}

=== 📚 Database Information (Secondary Reference Only - Use only if Google data is incomplete) ===
${context}`;

                    const enhancedSystemPrompt = `You are the official AI Assistant of the Physical Education Department, RKSD College. Your identity is "Main RKSD College ke Physical Education Department ka Assistant hoon".

🚫 OFF-TOPIC RULE: If the query is NOT related to RKSD College or its Physical Education Department, respond ONLY with: "Main sirf RKSD College ke Physical Education Department se related questions answer kar sakta hoon. Department ke baare mein kuch poochhna ho to zaroor batayein!"

🚨 CRITICAL PRIORITY INSTRUCTION - MUST FOLLOW:
I just searched Google for "${message}" and received VERIFIED data.

STRICT RULES FOR ACCURATE, DETAILED RESPONSES:
1. The "GOOGLE AI OVERVIEW" section is your PRIMARY and MOST ACCURATE source
2. Use ONLY the information present in the data - NEVER invent or guess details
3. Present ALL information that IS available comprehensively and professionally
4. If specific numbers/measurements are in the data, state them exactly
5. If specific lists are provided, include ALL items mentioned
6. Organize information logically with proper categories when data supports it
7. If data is limited/incomplete, present what's available clearly without making up details
8. Use professional, conversational Hinglish - clear and informative
9. Present information in structured, flowing paragraphs - NO bullet points or asterisks
10. DO NOT say "mujhe pata nahi" if Google data has the answer

⚠️ CRITICAL: DO NOT MAKE UP DETAILS
- If the data says "sports facilities are available" but doesn't list specific dimensions → don't invent dimensions
- If the data lists "basketball, badminton" → don't add other sports not mentioned
- Only state facts that are explicitly present in the GOOGLE AI OVERVIEW section
- If data is incomplete, you can say "college website par complete details available hain"

FORMATTING STYLE (PROFESSIONAL):
- Use paragraph headings naturally: "Sports facilities ki baat karein toh..."
- Separate categories with clear transitions: "Indoor facilities mein..."
- List all items from data in flowing sentences: "yahan cricket, football, volleyball facilities hain"
- Include all specific details present in data: dimensions, quantities when mentioned
- Keep language professional but conversational and natural

CURRENT DATE AND TIME:
Today's Date: ${todayDate}
Current Time: ${indiaTime}

College Information:
${enhancedContext}

Response Guidelines:
- Reply in natural, professional Hinglish (real mix of Hindi + English)
- Be comprehensive with information that EXISTS in the data
- Organize information clearly and professionally
- Use conversational but authoritative tone
- Include specific details when they're in the data - be accurate
- NEVER use bullet points (*), asterisks, numbered lists - use natural paragraphs
- Use emojis very sparingly (👋, 🎓, 🏟️)
- Never repeat same info in Hindi and English
- Always use correct words (✅ "mera", "aapka"; ❌ "mujhka", "tumhka")
- If full details aren't in data, guide user to official website or office`;

                    const enhancedMessages = [
                      { role: "system", content: enhancedSystemPrompt },
                      ...session.messages.map((m) => ({
                        role: m.role,
                        content: m.content,
                      })),
                    ];

                    try {
                      const retryResult = await callGroqWithFallback(enhancedMessages, {
                        model: "llama-3.3-70b-versatile",
                        max_tokens: 1500,
                        temperature: 0.3,
                      });
                      assistantResponse = retryResult.content || assistantResponse;
                      serpApiUsed = true;
                      console.log(`✅ Generated response with SerpApi data via Groq key #${retryResult.keyIndex}`);
                      console.log("📝 Response using Google data:", assistantResponse.substring(0, 150) + "...");
                    } catch (groqErr: any) {
                      console.warn("⚠️ Groq SerpAPI retry failed:", groqErr.message);
                    }
                  } else {
                    console.log("No relevant information found via SerpApi");
                    assistantResponse =
                      "Sorry, mujhe is baare mein accurate information nahi mili. Kripya college office se contact karein ya official website rksdcollege.ac.in check karein.";
                  }
                } else {
                  const errorText = await searchResponse.text();
                  console.log(
                    "SerpApi error:",
                    searchResponse.status,
                    errorText,
                  );
                  assistantResponse =
                    "Sorry, mujhe is baare mein accurate information nahi mili. Kripya college office se contact karein ya official website rksdcollege.ac.in check karein.";
                }
              } else {
                console.log("SerpApi key not configured");
                assistantResponse =
                  "Sorry, mujhe is baare mein accurate information nahi mili. Kripya college office se contact karein ya official website rksdcollege.ac.in check karein.";
              }
            } catch (searchError) {
              console.error("Error searching with SerpApi:", searchError);
              assistantResponse =
                "Sorry, mujhe is baare mein accurate information nahi mili. Kripya college office se contact karein ya official website rksdcollege.ac.in check karein.";
            }
          }
        }
        // LLM fallback system handles errors above (GPT-5 → Groq)
      } catch (apiError) {
        console.warn("Groq API error, using fallback:", apiError);
      }

      // 🔍 HYBRID LAYER MODEL - STEP 3: CROSS VERIFICATION WITH REGENERATION
      // Verify response consistency and accuracy, regenerate if needed
      try {
        console.log(`\n🔍 ===== CROSS VERIFICATION LAYER =====`);
        console.log(
          `📝 Original Response: "${assistantResponse.substring(0, 100)}..."`,
        );

        let needsRegeneration = false;
        let regenerationReason = "";

        // Check 1: Response is not empty or too short
        if (!assistantResponse || assistantResponse.trim().length < 10) {
          needsRegeneration = true;
          regenerationReason = "Response too short or empty";
        }

        // Check 2: For non-greeting queries, verify we have substantial content
        // SKIP VERIFICATION IF SERPAPI WAS ALREADY USED (to avoid overwriting good responses)
        if (
          !needsRegeneration &&
          queryCategory !== "greeting" &&
          !serpApiUsed
        ) {
          const uncertainPhrases = [
            "mujhe nahi pata",
            "i don't know",
            "pata nahi",
            "information unavailable",
            "currently unavailable",
            "mujhe iska pata nahi",
            "jaankari nahin",
          ];

          const seemsUncertain = uncertainPhrases.some((phrase) =>
            assistantResponse.toLowerCase().includes(phrase),
          );

          // Check 3: For public_info, uncertainty is a red flag if we prioritized SerpAPI
          if (
            seemsUncertain &&
            queryCategory === "public_info" &&
            shouldPrioritizeSerpAPI
          ) {
            needsRegeneration = true;
            regenerationReason =
              "Public info query uncertain despite SerpAPI priority";
            console.log(`⚠️ ${regenerationReason}`);
          }

          // Check 4: For admin_info, verify DB was actually checked
          else if (seemsUncertain && queryCategory === "admin_info") {
            if (!shouldFetchFromDB) {
              needsRegeneration = true;
              regenerationReason =
                "Admin info uncertain but DB was not checked";
              console.log(`⚠️ ${regenerationReason}`);
            } else {
              console.log(
                `✅ Admin info uncertain but DB was properly checked - acceptable`,
              );
            }
          }
        } else if (serpApiUsed) {
          console.log(
            `✅ SerpAPI was used - skipping verification to preserve Google AI Overview response`,
          );
        }

        // 🔄 REGENERATION: If verification failed, actually regenerate with Groq
        if (needsRegeneration && groqApiKey) {
          console.log(`\n🔄 ===== REGENERATING RESPONSE WITH GROQ =====`);
          console.log(`❌ Reason: ${regenerationReason}`);
          console.log(`🔄 Attempting to regenerate with stricter prompt...`);

          try {
            // Create stricter prompt that demands specific information
            const stricterPrompt =
              systemPrompt +
              `\n\nIMPORTANT: The previous response was too vague or uncertain. Please provide a more specific and confident answer using the College Information provided above. If you truly don't have the specific information, clearly state what you DO know about related topics.`;

            const retryMessages = [
              { role: "system", content: stricterPrompt },
              ...session.messages
                .slice(-3)
                .map((m) => ({ role: m.role, content: m.content })), // Use last 3 messages for context
            ];

            try {
              const regenResult = await callGroqWithFallback(retryMessages as any, {
                model: "llama-3.3-70b-versatile",
                max_tokens: 500,
                temperature: 0.5,
              });
              const newResponse = regenResult.content;
              if (newResponse && newResponse.trim().length > 10) {
                assistantResponse = newResponse;
                console.log(`✅ Successfully regenerated response via Groq key #${regenResult.keyIndex}`);
                console.log(`📝 New response: "${assistantResponse.substring(0, 100)}..."`);
              } else {
                console.log(`⚠️ Regeneration returned empty, using previous response`);
              }
            } catch (regenErr: any) {
              console.log(`⚠️ Groq regeneration failed: ${regenErr.message}`);
              assistantResponse =
                "Sorry, mujhe is baare mein accurate information nahi mili. Kripya college office se contact karein ya official website rksdcollege.ac.in check karein.";
            }
          } catch (regenerateError) {
            console.error(
              "Error during response regeneration:",
              regenerateError,
            );
            assistantResponse =
              "Sorry, mujhe is baare mein accurate information nahi mili. Kripya college office se contact karein ya official website rksdcollege.ac.in check karein.";
          }
        } else if (needsRegeneration) {
          // No Groq API key, use static fallback
          console.log(
            `⚠️ Regeneration needed but no Groq API key, using fallback`,
          );
          assistantResponse =
            "Sorry, mujhe is baare mein accurate information nahi mili. Kripya college office se contact karein ya official website rksdcollege.ac.in check karein.";
        }

        // Final verification check
        console.log(`\n✅ ===== VERIFICATION COMPLETE =====`);
        console.log(`📊 Query Category: ${queryCategory}`);
        console.log(`🎯 Primary Source: ${primarySource}`);
        console.log(
          `🔄 Regenerated: ${needsRegeneration ? "Yes - " + regenerationReason : "No"}`,
        );
        console.log(
          `📝 Final Response Length: ${assistantResponse.length} chars`,
        );
        console.log(`====================================\n`);
      } catch (verificationError) {
        console.error("❌ Error in cross-verification:", verificationError);
        // Continue with original response if verification fails
      }

      // Add assistant response to session memory
      sessionManager.addMessage(
        currentSessionId,
        "assistant",
        assistantResponse,
      );

      const savedResponse = await storage.createChatMessage({
        content: assistantResponse,
        role: "assistant",
        language: language || "en",
      });

      res.json({
        response: assistantResponse,
        messageId: savedResponse.id,
        sessionId: currentSessionId,
      });
    } catch (error) {
      console.error("Error in ask endpoint:", error);
      try {
        const fallbackResponse = await storage.createChatMessage({
          content:
            "I'm experiencing some technical difficulties, but I'm here to help! Please try asking your question again, or contact RKSD College directly for urgent inquiries.",
          role: "assistant",
          language: "en",
        });
        res.json({
          response: fallbackResponse.content,
          messageId: fallbackResponse.id,
        });
      } catch (fallbackError) {
        console.error("Fallback also failed:", fallbackError);
        res.status(500).json({
          message: "Service temporarily unavailable. Please try again later.",
        });
      }
    }
  });

  // Text-to-Speech with three-tier fallback system
  app.post("/api/tts", async (req, res) => {
    try {
      const {
        text,
        voiceId,
        modelId,
        stability,
        similarityBoost,
        cartesiaModelId,
        speed,
        emotions,
        language,
      } = ttsSchema.parse(req.body);
      if (!text || text.trim().length === 0) {
        return res.status(400).json({
          message: "Text cannot be empty",
          error: "EMPTY_TEXT",
        });
      }

      const cleanTextForSpeech = (text: string) => {
        return text
          .replace(/\|/g, " ")
          .replace(/---+/g, " ")
          .replace(/#{1,6}\s+/g, "")
          .replace(/\*\*(.*?)\*\*/g, "$1")
          .replace(/\*(.*?)\*/g, "$1")
          .replace(/`(.*?)`/g, "$1")
          .replace(/\[(.*?)\]\(.*?\)/g, "$1")
          .replace(/📊|📌|🎓|⏰|📞/g, "")
          .replace(/\s+/g, " ")
          .trim();
      };

      const detectLanguage = (text: string): "hi" | "en" => {
        const hindiWords = [
          "aap",
          "hai",
          "hain",
          "kya",
          "kaise",
          "kahan",
          "namaste",
          "dhanyawad",
          "main",
          "hum",
          "kar",
          "karo",
          "karna",
          "kiya",
          "ghar",
          "paani",
          "khana",
          "college",
          "student",
          "teacher",
          "library",
          "hostel",
          "fees",
          "exam",
          "result",
          "madad",
          "help",
          "problem",
          "achha",
          "bura",
          "naya",
          "purana",
          "bada",
          "chota",
          "se",
          "ko",
          "ke",
          "ki",
          "ka",
          "me",
          "mein",
          "par",
          "pe",
          "tak",
          "aur",
          "ya",
          "lekin",
          "agar",
          "to",
          "phir",
          "fir",
          "kyun",
          "kyon",
          "kab",
          "kon",
          "kaun",
          "kitna",
          "kitni",
          "kitne",
        ];
        const lowerText = text.toLowerCase();
        const hindiWordCount = hindiWords.filter((word) =>
          lowerText.includes(word),
        ).length;
        const totalWords = text.split(/\s+/).length;
        return hindiWordCount / totalWords > 0.2 ? "hi" : "en";
      };

      const cleanedText = cleanTextForSpeech(text);
      const detectedLanguage = detectLanguage(cleanedText);
      console.log(
        "⚡ TTS: Optimized parallel synthesis for text:",
        cleanedText.substring(0, 50) + "...",
      );
      console.log("TTS: Text length:", cleanedText.length);
      console.log("TTS: Detected language:", detectedLanguage);

      // RKSD College TTS Fallback Chain: Cartesia (primary) → ElevenLabs (fallback) → OpenAI TTS (3rd fallback)
      const elevenlabsApiKey = process.env.ELEVENLABS_API_KEY;
      const cartesiaApiKey = process.env.CARTESIA_API_KEY;
      const openaiApiKey = process.env.OPENAI_API_KEY;

      // TIER 1: Try Cartesia TTS first (Primary provider for RKSD College)
      if (cartesiaApiKey && cartesiaApiKey !== "your_cartesia_api_key_here") {
        try {
          console.log("⚡ RKSD TTS: Trying Cartesia TTS (Tier 1 - Primary)...");
          const correctedText = applyPronunciationCorrections(cleanedText);
          const cartesiaVoiceMapping = {
            iWNf11sz1GrUE4ppxTOL: "fd2ada67-c2d9-4afe-b474-6386b87d8fc3",
          };
          const cartesiaVoiceId =
            cartesiaVoiceMapping[
              voiceId as keyof typeof cartesiaVoiceMapping
            ] || "fd2ada67-c2d9-4afe-b474-6386b87d8fc3";
          const defaultEmotions =
            emotions && emotions.length > 0 ? emotions : ["positivity"];

          const cartesiaRequestBody = {
            model_id: cartesiaModelId || "sonic-2.0",
            transcript: correctedText,
            voice: {
              mode: "id",
              id: cartesiaVoiceId,
              __experimental_controls: {
                speed: speed || "normal",
                emotion: defaultEmotions,
              },
            },
            output_format: {
              container: "wav",
              encoding: "pcm_s16le",
              sample_rate: 44100,
            },
            language: detectedLanguage,
          };

          const cartesiaResponse = await fetch(
            "https://api.cartesia.ai/tts/bytes",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${cartesiaApiKey}`,
                "Cartesia-Version": "2025-04-16",
                "Content-Type": "application/json",
              },
              body: JSON.stringify(cartesiaRequestBody),
            },
          );

          if (cartesiaResponse.ok) {
            const audioBuffer = await cartesiaResponse.arrayBuffer();
            console.log(
              "✅ RKSD TTS: Cartesia success! Audio size:",
              audioBuffer.byteLength,
              "bytes",
            );

            res.set({
              "Content-Type": "audio/wav",
              "Content-Length": audioBuffer.byteLength.toString(),
              "X-TTS-Provider": "cartesia",
            });
            return res.send(Buffer.from(audioBuffer));
          } else {
            throw new Error(`Cartesia failed: ${cartesiaResponse.status}`);
          }
        } catch (cartesiaError) {
          console.warn(
            "⚠️ RKSD TTS: Cartesia failed, trying ElevenLabs (Tier 2)...",
            cartesiaError,
          );

          // TIER 2: Try ElevenLabs as fallback
          if (elevenlabsApiKey && elevenlabsApiKey !== "your_elevenlabs_api_key_here") {
            try {
              console.log("⚡ RKSD TTS: Trying ElevenLabs TTS (Tier 2 - Fallback)...");
              
              const requestBody = {
                text: cleanedText,
                model_id: modelId || "eleven_multilingual_v2",
                voice_settings: {
                  stability: stability || 0.6,
                  similarity_boost: similarityBoost || 0.8,
                  style: 0.3,
                  use_speaker_boost: true
                }
              };

              const elevenlabsResponse = await fetch(
                `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
                {
                  method: 'POST',
                  headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': elevenlabsApiKey
                  },
                  body: JSON.stringify(requestBody)
                }
              );

              if (elevenlabsResponse.ok) {
                const audioBuffer = await elevenlabsResponse.arrayBuffer();
                console.log(
                  "✅ RKSD TTS: ElevenLabs fallback success! Audio size:",
                  audioBuffer.byteLength,
                  "bytes",
                );

                res.set({
                  "Content-Type": "audio/mpeg",
                  "Content-Length": audioBuffer.byteLength.toString(),
                  "X-TTS-Provider": "elevenlabs",
                });
                return res.send(Buffer.from(audioBuffer));
              } else {
                throw new Error(`ElevenLabs failed: ${elevenlabsResponse.status}`);
              }
            } catch (elevenlabsError) {
              console.warn(
                "⚠️ RKSD TTS: ElevenLabs failed, trying OpenAI TTS (Tier 3)...",
                elevenlabsError,
              );

              // TIER 3: Try OpenAI TTS as final fallback
              if (openaiApiKey && openaiApiKey !== "your_openai_api_key_here") {
                try {
                  console.log("⚡ RKSD TTS: Trying OpenAI TTS (Tier 3 - Final Fallback)...");
                  const openai = new OpenAI({ apiKey: openaiApiKey });
                  const mp3Response = await openai.audio.speech.create({
                    model: "tts-1",
                    voice: "nova",
                    input: cleanedText,
                    speed: 1.0,
                  });
                  const audioBuffer = Buffer.from(await mp3Response.arrayBuffer());
                  console.log(
                    "✅ RKSD TTS: OpenAI final fallback success! Audio size:",
                    audioBuffer.byteLength,
                    "bytes",
                  );

                  res.set({
                    "Content-Type": "audio/mpeg",
                    "Content-Length": audioBuffer.byteLength.toString(),
                    "X-TTS-Provider": "openai",
                  });
                  return res.send(audioBuffer);
                } catch (openaiError) {
                  console.error(
                    "❌ RKSD TTS: All 3 providers failed (Cartesia, ElevenLabs, OpenAI):",
                    openaiError,
                  );
                  return res.status(503).json({
                    message: "Speech synthesis unavailable - all providers failed",
                    error: "ALL_TTS_PROVIDERS_FAILED",
                  });
                }
              } else {
                console.error("❌ RKSD TTS: OpenAI not configured for final fallback");
                return res.status(503).json({
                  message:
                    "Speech synthesis unavailable - Cartesia and ElevenLabs failed, OpenAI not configured",
                  error: "TWO_PROVIDERS_FAILED_NO_FINAL_FALLBACK",
                });
              }
            }
          } else {
            console.warn("⚠️ RKSD TTS: ElevenLabs not configured, trying OpenAI TTS (Tier 3)...");
            
            // TIER 3: Try OpenAI TTS if ElevenLabs not available
            if (openaiApiKey && openaiApiKey !== "your_openai_api_key_here") {
              try {
                console.log("⚡ RKSD TTS: Trying OpenAI TTS (Tier 3)...");
                const openai = new OpenAI({ apiKey: openaiApiKey });
                const mp3Response = await openai.audio.speech.create({
                  model: "tts-1",
                  voice: "nova",
                  input: cleanedText,
                  speed: 1.0,
                });
                const audioBuffer = Buffer.from(await mp3Response.arrayBuffer());
                console.log(
                  "✅ RKSD TTS: OpenAI fallback success! Audio size:",
                  audioBuffer.byteLength,
                  "bytes",
                );

                res.set({
                  "Content-Type": "audio/mpeg",
                  "Content-Length": audioBuffer.byteLength.toString(),
                  "X-TTS-Provider": "openai",
                });
                return res.send(audioBuffer);
              } catch (openaiError) {
                console.error(
                  "❌ RKSD TTS: Cartesia and OpenAI failed, ElevenLabs not configured:",
                  openaiError,
                );
                return res.status(503).json({
                  message: "Speech synthesis unavailable - Cartesia and OpenAI failed",
                  error: "CARTESIA_OPENAI_FAILED",
                });
              }
            } else {
              console.error("❌ RKSD TTS: Cartesia failed, no fallback configured");
              return res.status(503).json({
                message:
                  "Speech synthesis unavailable - Cartesia failed and no fallback configured",
                error: "CARTESIA_FAILED_NO_FALLBACK",
              });
            }
          }
        }
      } else {
        console.log("⚠️ RKSD TTS: Cartesia not configured, trying fallback providers...");
        
        // If Cartesia not configured, try ElevenLabs
        if (elevenlabsApiKey && elevenlabsApiKey !== "your_elevenlabs_api_key_here") {
          try {
            console.log("⚡ RKSD TTS: Trying ElevenLabs TTS (Cartesia not available)...");
            
            const requestBody = {
              text: cleanedText,
              model_id: modelId || "eleven_multilingual_v2",
              voice_settings: {
                stability: stability || 0.6,
                similarity_boost: similarityBoost || 0.8,
                style: 0.3,
                use_speaker_boost: true
              }
            };

            const elevenlabsResponse = await fetch(
              `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
              {
                method: 'POST',
                headers: {
                  'Accept': 'audio/mpeg',
                  'Content-Type': 'application/json',
                  'xi-api-key': elevenlabsApiKey
                },
                body: JSON.stringify(requestBody)
              }
            );

            if (elevenlabsResponse.ok) {
              const audioBuffer = await elevenlabsResponse.arrayBuffer();
              console.log(
                "✅ RKSD TTS: ElevenLabs success! Audio size:",
                audioBuffer.byteLength,
                "bytes",
              );

              res.set({
                "Content-Type": "audio/mpeg",
                "Content-Length": audioBuffer.byteLength.toString(),
                "X-TTS-Provider": "elevenlabs",
              });
              return res.send(Buffer.from(audioBuffer));
            } else {
              throw new Error(`ElevenLabs failed: ${elevenlabsResponse.status}`);
            }
          } catch (elevenlabsError) {
            console.warn(
              "⚠️ RKSD TTS: ElevenLabs failed, trying OpenAI TTS...",
              elevenlabsError,
            );

            // Try OpenAI as final fallback
            if (openaiApiKey && openaiApiKey !== "your_openai_api_key_here") {
              try {
                console.log("⚡ RKSD TTS: Trying OpenAI TTS (final fallback)...");
                const openai = new OpenAI({ apiKey: openaiApiKey });
                const mp3Response = await openai.audio.speech.create({
                  model: "tts-1",
                  voice: "nova",
                  input: cleanedText,
                  speed: 1.0,
                });
                const audioBuffer = Buffer.from(await mp3Response.arrayBuffer());
                console.log(
                  "✅ RKSD TTS: OpenAI final fallback success! Audio size:",
                  audioBuffer.byteLength,
                  "bytes",
                );

                res.set({
                  "Content-Type": "audio/mpeg",
                  "Content-Length": audioBuffer.byteLength.toString(),
                  "X-TTS-Provider": "openai",
                });
                return res.send(audioBuffer);
              } catch (openaiError) {
                console.error(
                  "❌ RKSD TTS: All providers failed:",
                  openaiError,
                );
                return res.status(503).json({
                  message: "Speech synthesis unavailable - all providers failed",
                  error: "ALL_TTS_PROVIDERS_FAILED",
                });
              }
            }
          }
        }
        
        console.error("❌ RKSD TTS: No TTS providers configured");
        return res.status(503).json({
          message: "Speech synthesis unavailable - no providers configured",
          error: "NO_TTS_PROVIDERS_CONFIGURED",
        });
      }

      // This should never be reached due to returns above
      console.error("❌ RKSD TTS: Unexpected code path");
      return res.status(503).json({
        message: "Speech synthesis failed unexpectedly",
        error: "UNEXPECTED_ERROR",
      });
    } catch (error) {
      console.error("Error in TTS endpoint:", error);
      res.status(500).json({
        message: "Internal server error during speech generation",
        error: "SERVER_ERROR",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Keep the old code structure to avoid breaking changes - Remove this later
  app.post("/api/tts-old", async (req, res) => {
    try {
      const {
        text,
        voiceId,
        modelId,
        stability,
        similarityBoost,
        cartesiaModelId,
        speed,
        emotions,
        language,
      } = ttsSchema.parse(req.body);
      if (!text || text.trim().length === 0) {
        return res.status(400).json({
          message: "Text cannot be empty",
          error: "EMPTY_TEXT",
        });
      }

      const cleanTextForSpeech = (text: string) => {
        return text
          .replace(/\|/g, " ")
          .replace(/---+/g, " ")
          .replace(/#{1,6}\s+/g, "")
          .replace(/\*\*(.*?)\*\*/g, "$1")
          .replace(/\*(.*?)\*/g, "$1")
          .replace(/`(.*?)`/g, "$1")
          .replace(/\[(.*?)\]\(.*?\)/g, "$1")
          .replace(/📊|📌|🎓|⏰|📞/g, "")
          .replace(/\s+/g, " ")
          .trim();
      };

      const detectLanguage = (text: string): "hi" | "en" => {
        const hindiWords = [
          "aap",
          "hai",
          "hain",
          "kya",
          "kaise",
          "kahan",
          "namaste",
          "dhanyawad",
          "main",
          "hum",
          "kar",
          "karo",
          "karna",
          "kiya",
          "ghar",
          "paani",
          "khana",
          "college",
          "student",
          "teacher",
          "library",
          "hostel",
          "fees",
          "exam",
          "result",
          "madad",
          "help",
          "problem",
          "achha",
          "bura",
          "naya",
          "purana",
          "bada",
          "chota",
          "se",
          "ko",
          "ke",
          "ki",
          "ka",
          "me",
          "mein",
          "par",
          "pe",
          "tak",
          "aur",
          "ya",
          "lekin",
          "agar",
          "to",
          "phir",
          "fir",
          "kyun",
          "kyon",
          "kab",
          "kon",
          "kaun",
          "kitna",
          "kitni",
          "kitne",
        ];
        const lowerText = text.toLowerCase();
        const hindiWordCount = hindiWords.filter((word) =>
          lowerText.includes(word),
        ).length;
        const totalWords = text.split(/\s+/).length;
        return hindiWordCount / totalWords > 0.2 ? "hi" : "en";
      };

      const cleanedText = cleanTextForSpeech(text);
      const detectedLanguage = detectLanguage(cleanedText);

      const openaiApiKey = process.env.OPENAI_API_KEY;
      const cartesiaApiKey = process.env.CARTESIA_API_KEY;

      // Try OpenAI first, then Cartesia fallback (old logic)
      if (openaiApiKey && openaiApiKey !== "your_openai_api_key_here") {
        try {
          const openai = new OpenAI({ apiKey: openaiApiKey });
          const mp3Response = await openai.audio.speech.create({
            model: "tts-1",
            voice: "ash",
            input: cleanedText,
            speed: 1.0,
          });
          const audioBuffer = Buffer.from(await mp3Response.arrayBuffer());

          res.set({
            "Content-Type": "audio/mpeg",
            "Content-Length": audioBuffer.byteLength.toString(),
            "X-TTS-Provider": "openai",
          });
          return res.send(audioBuffer);
        } catch (openaiError) {
          console.warn("OpenAI failed, trying Cartesia...", openaiError);

          if (
            cartesiaApiKey &&
            cartesiaApiKey !== "your_cartesia_api_key_here"
          ) {
            try {
              const correctedText = applyPronunciationCorrections(cleanedText);
              const cartesiaVoiceMapping = {
                iWNf11sz1GrUE4ppxTOL: "fd2ada67-c2d9-4afe-b474-6386b87d8fc3",
              };
              const cartesiaVoiceId =
                cartesiaVoiceMapping[
                  voiceId as keyof typeof cartesiaVoiceMapping
                ] || "fd2ada67-c2d9-4afe-b474-6386b87d8fc3";
              const defaultEmotions =
                emotions && emotions.length > 0 ? emotions : ["positivity"];

              const cartesiaRequestBody = {
                model_id: cartesiaModelId || "sonic-2.0",
                transcript: correctedText,
                voice: {
                  mode: "id",
                  id: cartesiaVoiceId,
                  __experimental_controls: {
                    speed: speed || "fast",
                    emotion: defaultEmotions,
                  },
                },
                output_format: {
                  container: "wav",
                  encoding: "pcm_s16le",
                  sample_rate: 44100,
                },
                language: detectedLanguage,
              };

              const cartesiaResponse = await fetch(
                "https://api.cartesia.ai/tts/bytes",
                {
                  method: "POST",
                  headers: {
                    Authorization: `Bearer ${cartesiaApiKey}`,
                    "Cartesia-Version": "2025-04-16",
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify(cartesiaRequestBody),
                },
              );

              if (!cartesiaResponse.ok) {
                throw new Error(`Cartesia failed: ${cartesiaResponse.status}`);
              }

              const audioBuffer = await cartesiaResponse.arrayBuffer();

              res.set({
                "Content-Type": "audio/wav",
                "Content-Length": audioBuffer.byteLength.toString(),
                "X-TTS-Provider": "cartesia",
              });
              return res.send(Buffer.from(audioBuffer));
            } catch (cartesiaError) {
              return res.status(503).json({
                message: "Speech synthesis unavailable - both providers failed",
                error: "ALL_TTS_PROVIDERS_FAILED",
              });
            }
          }
        }
      } else if (
        cartesiaApiKey &&
        cartesiaApiKey !== "your_cartesia_api_key_here"
      ) {
        try {
          const correctedText = applyPronunciationCorrections(cleanedText);
          const cartesiaVoiceMapping = {
            iWNf11sz1GrUE4ppxTOL: "fd2ada67-c2d9-4afe-b474-6386b87d8fc3",
          };
          const cartesiaVoiceId =
            cartesiaVoiceMapping[
              voiceId as keyof typeof cartesiaVoiceMapping
            ] || "fd2ada67-c2d9-4afe-b474-6386b87d8fc3";
          const defaultEmotions =
            emotions && emotions.length > 0 ? emotions : ["positivity"];

          const cartesiaRequestBody = {
            model_id: cartesiaModelId || "sonic-2.0",
            transcript: correctedText,
            voice: {
              mode: "id",
              id: cartesiaVoiceId,
              __experimental_controls: {
                speed: speed || "fast",
                emotion: defaultEmotions,
              },
            },
            output_format: {
              container: "wav",
              encoding: "pcm_s16le",
              sample_rate: 44100,
            },
            language: detectedLanguage,
          };

          const cartesiaResponse = await fetch(
            "https://api.cartesia.ai/tts/bytes",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${cartesiaApiKey}`,
                "Cartesia-Version": "2025-04-16",
                "Content-Type": "application/json",
              },
              body: JSON.stringify(cartesiaRequestBody),
            },
          );

          if (!cartesiaResponse.ok) {
            throw new Error(`Cartesia failed: ${cartesiaResponse.status}`);
          }

          const audioBuffer = await cartesiaResponse.arrayBuffer();

          res.set({
            "Content-Type": "audio/wav",
            "Content-Length": audioBuffer.byteLength.toString(),
            "X-TTS-Provider": "cartesia",
          });
          return res.send(Buffer.from(audioBuffer));
        } catch (error) {
          console.error("❌ TTS: Cartesia failed:", error);
          return res.status(503).json({
            message: "Speech synthesis unavailable - Cartesia failed",
            error: "CARTESIA_FAILED",
          });
        }
      } else {
        console.error("TTS: No TTS providers configured");
        return res.status(503).json({
          message: "Speech synthesis unavailable - no API keys configured",
          error: "NO_TTS_PROVIDERS",
        });
      }
    } catch (error) {
      console.error("Error in TTS endpoint:", error);
      res.status(500).json({
        message: "Internal server error during speech generation",
        error: "SERVER_ERROR",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Get college information
  app.get("/api/college-info", async (req, res) => {
    try {
      const { category, search } = req.query;
      let collegeInfo;
      if (search) {
        collegeInfo = await storage.searchCollegeInfo(search as string);
      } else if (category) {
        collegeInfo = await storage.getCollegeInfoByCategory(
          category as string,
        );
      } else {
        collegeInfo = await storage.getCollegeInfo();
      }
      res.json(collegeInfo);
    } catch (error) {
      console.error("Error fetching college info:", error);
      res.status(500).json({ message: "Failed to fetch college information" });
    }
  });

  // Admin: Login
  app.post("/api/admin/login", loginAdmin);

  // Admin: Get college basic info from Supabase
  app.get("/api/admin/college-info", requireAdminAuth, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("college_settings")
        .select("*")
        .eq("key", "college_basic_info")
        .single();

      if (error && error.code !== "PGRST116") throw error;

      const collegeInfo = data?.value || {};
      res.json({ college: collegeInfo });
    } catch (error: any) {
      console.error("Error fetching college data:", error);
      res.status(500).json({ message: "Failed to fetch college data" });
    }
  });

  // Admin: Update college basic info in Supabase
  app.post("/api/admin/college-info", requireAdminAuth, async (req, res) => {
    try {
      const collegeInfo = {
        name: req.body.name,
        established_year: req.body.established_year
          ? parseInt(req.body.established_year)
          : null,
        motto: req.body.motto,
        principal: req.body.principal,
        vice_principal: req.body.vice_principal,
        registrar: req.body.registrar,
        address: req.body.address,
        phone: req.body.phone,
        email: {
          college_email: req.body.email,
        },
        website: req.body.website,
        affiliation: req.body.affiliation,
        student_strength_approx: req.body.student_strength
          ? parseInt(req.body.student_strength)
          : null,
        faculty_strength_approx: req.body.faculty_strength
          ? parseInt(req.body.faculty_strength)
          : null,
      };

      const { error } = await supabase.from("college_settings").upsert(
        {
          key: "college_basic_info",
          value: collegeInfo,
        },
        {
          onConflict: "key",
        },
      );

      if (error) throw error;
      res.json({
        success: true,
        message: "College information updated successfully",
      });
    } catch (error: any) {
      console.error("Error updating college data:", error);
      res.status(500).json({ message: "Failed to update college data" });
    }
  });

  // Admin: Get all college settings
  app.get("/api/admin/college-settings", requireAdminAuth, async (req, res) => {
    try {
      const { data, error } = await supabase
        .from("college_settings")
        .select("*")
        .neq("key", "college_basic_info")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      res.json({ settings: data || [] });
    } catch (error: any) {
      console.error("Error fetching college settings:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Admin: Create college setting
  app.post(
    "/api/admin/college-settings",
    requireAdminAuth,
    async (req, res) => {
      try {
        const { key, title, content, category } = req.body;

        const { data, error } = await supabase
          .from("college_settings")
          .insert({
            key: key || `setting_${Date.now()}`,
            value: { title, content, category },
          })
          .select()
          .single();

        if (error) throw error;
        res.json({ setting: data });
      } catch (error: any) {
        console.error("Error creating college setting:", error);
        res.status(500).json({ message: error.message });
      }
    },
  );

  // Admin: Update college setting
  app.put(
    "/api/admin/college-settings/:id",
    requireAdminAuth,
    async (req, res) => {
      try {
        const { id } = req.params;
        const { title, content, category } = req.body;

        const { data, error } = await supabase
          .from("college_settings")
          .update({
            value: { title, content, category },
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select()
          .single();

        if (error) throw error;
        res.json({ setting: data });
      } catch (error: any) {
        console.error("Error updating college setting:", error);
        res.status(500).json({ message: error.message });
      }
    },
  );

  // Admin: Delete college setting
  app.delete(
    "/api/admin/college-settings/:id",
    requireAdminAuth,
    async (req, res) => {
      try {
        const { id } = req.params;

        const { error } = await supabase
          .from("college_settings")
          .delete()
          .eq("id", id);

        if (error) throw error;
        res.json({ success: true });
      } catch (error: any) {
        console.error("Error deleting college setting:", error);
        res.status(500).json({ message: error.message });
      }
    },
  );

  // Admin: Get classes data JSON
  app.get("/api/admin/classes", requireAdminAuth, async (req, res) => {
    try {
      const data = await storage.getClassesDataJSON();
      res.json(data);
    } catch (error) {
      console.error("Error fetching classes data:", error);
      res.status(500).json({ message: "Failed to fetch classes data" });
    }
  });

  // Admin: Update classes data JSON
  app.post("/api/admin/classes", requireAdminAuth, async (req, res) => {
    try {
      await storage.updateClassesDataJSON(req.body);
      res.json({ success: true, message: "Classes data updated successfully" });
    } catch (error) {
      console.error("Error updating classes data:", error);
      res.status(500).json({ message: "Failed to update classes data" });
    }
  });

  // ===== FILE EXTRACTION ENDPOINT =====
  // Accepts a text/csv file upload, uses Groq to extract structured data
  {
    const multer = (await import('multer')).default;
    const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

    app.post("/api/admin/extract-from-file", upload.single('file'), async (req: any, res) => {
      try {
        if (!req.file) return res.status(400).json({ message: "No file uploaded" });

        const fileText = req.file.buffer.toString('utf-8');
        const sectionType = (req.body.sectionType || 'entries') as string;

        const groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });

        let systemInstruction = '';
        if (sectionType === 'staff') {
          systemInstruction = `You are a data extraction assistant. Extract staff member information from the provided text/CSV data.
Return ONLY a plain text summary in this format (one staff per paragraph, no JSON):
"Name: [full name], Employee ID: [id if available], Role: [role], Designation: [designation], Department: [dept], Qualification: [qualification], Specialization: [specialization], Email: [email], Phone: [phone]"
If a field is missing, skip it. Extract all staff members found.`;
        } else if (sectionType === 'courses') {
          systemInstruction = `You are a data extraction assistant. Extract course information from the provided text/CSV data.
Return ONLY a plain text summary in this format (one course per paragraph, no JSON):
"Course Name: [name], Code: [code], Type: [UG/PG/Diploma], Duration: [duration], Seats: [seats], Fees: [fees per year], Eligibility: [eligibility], Description: [brief description]"
If a field is missing, skip it. Extract all courses found.`;
        } else {
          systemInstruction = `You are a data extraction assistant. Extract and summarize all relevant information from the provided text/CSV file in a clear, structured plain text format that can be used as input for an AI assistant.`;
        }

        const completion = await groqClient.chat.completions.create({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: `Extract the data from this file:\n\n${fileText.substring(0, 8000)}` }
          ],
          max_tokens: 2000,
          temperature: 0.1,
        });

        const extractedText = completion.choices[0]?.message?.content || fileText;
        res.json({ extractedText, originalLength: fileText.length });
      } catch (error: any) {
        console.error('File extraction error:', error);
        res.status(500).json({ message: error.message || 'File extraction failed' });
      }
    });
  }

  // Register new routes
  registerAdminRoutes(app);
  registerHeadAdminRoutes(app);
  registerDepartmentRoutes(app);
  registerUpdatesRoutes(app);

  // Check Supabase connection on startup + auto-migrate new tables
  checkSupabaseConnection().then((connected) => {
    if (connected) {
      console.log("✅ Supabase is ready for use");
      // Auto-create new tables & storage bucket
      runDatabaseSetup().catch(err => console.warn("DB setup error:", err.message));
    } else {
      console.log(
        "⚠️ Please run the SQL schema in Supabase (see SUPABASE_SETUP.md)",
      );
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
