# RKSD College - Physical Education Department Assistant

## Overview
This is an AI-powered assistant and management system specifically for the **Physical Education Department of RKSD College, Kaithal**. It features a simple text+voice chatbot for students/visitors, and an admin panel for department management. The admin panel supports creating "Mini Panels" — individual teacher control panels where each teacher can manage their own timetable, notices, and data.

## User Preferences
I want the AI to ask before making major changes and to prefer detailed explanations. Do not make changes to the folder `Z` or the file `Y`. I prefer an iterative development approach.

## System Architecture

### UI/UX Decisions
The platform features a professional, futuristic AI-themed landing page with neon glows, glassmorphism effects, and smooth animations. Admin panels are designed with professional dashboards, gradient-styled statistics, and real-time sync indicators. The AI Assistant interface supports both voice and text input, offering clear conversation flows and text-to-speech responses. The design system leverages Radix UI and Tailwind CSS for consistent and modern UI components across all interfaces.

**Court Admin Panel** (`/court-admin`): Professional purple gradient-themed admin panel for Kaithal District Court with 6 sections - Dashboard, Courtrooms, Buildings, Staff Directory, Files Tracking, and Building Images. Features include comprehensive CRUD operations, building image upload with metadata (title, description, room number, building name, department, contact person), and stats dashboard displaying total courtrooms, buildings, staff members, and active files.

### Technical Implementations
The frontend is built with React 18 and TypeScript, using Wouter for routing and TanStack Query for state management. Voice input is handled via the Web Speech API. The backend utilizes Express.js with TypeScript for API services, supported by a custom in-memory session manager for AI and token-based authentication. Supabase (PostgreSQL) serves as the primary database, employing Realtime subscriptions for instant data synchronization. AI capabilities are powered by OpenAI GPT-4 (Court Assistant) and Groq API Llama-3.3-70B (Campus AI), integrating data from both static JSON and live Supabase sources with intelligent intent classification. The system implements secure login for administrators and departments, provides real-time updates via Supabase Realtime, and is fully mobile-friendly.

**Court-Specific Features**: Three-tier TTS system (Cartesia → ElevenLabs → OpenAI fallback), intelligent query analyzer detecting location/navigation questions with keyword extraction, building images feature displaying relevant court location photos with metadata when users ask "where is X?" or "show me the registry office", and comprehensive admin panel for managing all court data with graceful error handling in database-unavailable scenarios.

**Court Assistant Technical Flow** (now fully aligned with College assistant):
1. **Static Lookup Layer** (instant, deterministic — court-unique): Checks `court-static-data.ts` for known rooms/services before calling LLM
2. **Supabase Data Fetch**: Fetches courtrooms, buildings, staff, files, timings, settings, building images based on query strategy
3. **LLM with Fallback**: OpenAI GPT-4o (primary) → Groq Llama-3.3-70B (fallback)
4. **Greeting Detection**: Skips web search and verification for simple greetings
5. **SerpAPI Web Search**: If AI indicates uncertainty (same `indicatesNoInfo` detection as college), searches `${query} Kaithal District Court` on Google, extracts AI Overview → organic results → regenerates response with GPT-4o
6. **Cross-Verification Layer**: Checks response quality; if uncertain despite having Supabase data, regenerates with Groq at lower temperature (0.5) for more focused answer
7. **3-Tier TTS**: Cartesia → ElevenLabs → OpenAI for voice output

### System Design Choices
The architecture is a three-tier model ensuring clear separation of concerns and access levels. It incorporates event-driven real-time updates through Supabase Realtime. The AI uses a hybrid data source approach, combining static JSON with dynamic Supabase data for comprehensive information. A 3-layer AI-powered hybrid layer model handles query processing, focusing on intent classification, smart source prioritization, and cross-verification for high accuracy.

## External Dependencies
- **OpenAI API**: Powers Court Assistant with GPT-4 and provides TTS capabilities for voice responses.
- **Groq API**: For Campus AI voice assistant capabilities and language model inference (Llama-3.3-70B).
- **Supabase**: Provides PostgreSQL database, authentication, and Realtime functionalities.
- **React 18**: Core library for building user interfaces.
- **Radix UI**: Unstyled component library for building accessible UI components.
- **Tailwind CSS**: Utility-first CSS framework for styling.
- **Wouter**: A minimalist routing library for React.
- **TanStack Query (React Query)**: For data fetching, caching, and state management.
- **Express.js**: Backend web application framework for API services.
- **Web Speech API**: For enabling browser-based voice input.
- **Cheerio**: Used for HTML parsing and web scraping.
- **SerpAPI**: For enhanced external data accuracy and AI Overview integration.

## Recent Updates

### December 17, 2025
- **Department Panel Redesign**: Complete overhaul of the department panel with 6 main sections (Dashboard, Department Info, Faculty, Courses, Classes, Others)
  - Added Manual and AI modes for all data entry sections using EnhancedAIInput and EnhancedAIPreview components
  - Implemented class hierarchy structure: shift (morning/evening) > year (1-6) > section (A-E) > class sessions
  - Added class_schedules table to database schema with full CRUD operations
  - Faculty section now syncs with staff_members table in real-time via Supabase
  - Courses section syncs with courses table for real-time updates
  - Added filtering capabilities for class schedules by shift, year, and section
  - Dashboard shows aggregated stats including faculty, courses, classes, and total items count
  - Department Info section allows editing of department details including slogan and location
- **Real-time Synchronization**: Added Supabase realtime subscriptions for:
  - staff_members table (faculty changes)
  - courses table (course changes)
  - class_schedules table (class schedule changes)
  - department_data table (other data changes)
- **New API Endpoints**:
  - `/api/department/:departmentId/class-schedules` - CRUD for class schedules
  - `/api/department/:departmentId/staff` - CRUD for faculty/staff
  - `/api/department/:departmentId/courses-list` - CRUD for courses
  - `/api/department/:departmentId/full-info` - GET/PUT for department info
  - `/api/department/:departmentId/ai-generate` - AI content generation for faculty, courses, classes, and other data

### November 10, 2025
- **Court Image Display & UX Enhancement**: Improved building image presentation with full-screen modal and compact chat layout
  - Fixed image cropping issue by changing from `object-cover` to `object-contain` with white padding - now shows complete images without cutting
  - Reduced chat image size (h-28 sm:h-32) for compact chat area while maintaining clarity
  - Implemented click-to-expand modal: images are small in chat, clicking opens full-screen modal with dark overlay, close button, and smooth animations
  - Modal features: max-h-[80vh] object-contain sizing, backdrop dismissal, AnimatePresence transitions
  - Updated all building responses to conversational Hinglish format instead of direct listings
  - Example: "Civil Block me aapko courtrooms, judge chambers aur legal aid cell milenge. Hearing ke liye aap Room 21 ya Room 22 me ja sakte hain..." (friendly and helpful vs robotic listing)
- **Court Building Image + Room & Service Lookup System**: Implemented static data-driven navigation system for instant deterministic responses without LLM latency
  - Created `server/court-static-data.ts` with BUILDINGS (civil, record, filing), ROOMS (15 mapped rooms), and SERVICES (30+ Hinglish keywords) data structures
  - Added static lookup in `/api/court/ask` that preempts LLM call when service keywords, room numbers, or building names are detected
  - Supports queries like "Mujhe certified copy leni hai" → instant response with Room 14 (Record Section) + building image
  - Uploaded 3 building images to `client/public/images/court/` (civil_block.png, record_section.png, filing_section.png)
  - System returns structured JSON with `buildingImages` array containing id, title, description, image_url, room_number, building_name
  - Maintains full backward compatibility - non-matching queries still flow through Supabase + AI-powered responses
- **Court TTS Text Normalization Enhancement**: Implemented comprehensive text normalization for Court Voice Assistant to properly read times, phone numbers, and email addresses - matching college voice assistant functionality
  - Added `normalizeEmails()` function with letter-by-letter domain spelling: "kaithalcourt@gov.in" → "kaithalcourt at the rate g, o, v dot i, n"
  - Enhanced phone number normalization to handle both international format (+91-1746-234567 → "plus nine one, one seven four six, two three four five six seven") and plain 10-digit Indian mobile numbers (9876543210 → "nine eight seven six five, four three two one zero")
  - Applied `normalizeTextForTTS()` in both Court TTS endpoints (ElevenLabs `/api/court/tts` and OpenAI `/api/court/tts-openai`) for consistent pronunciation
  - Added debug logging to preview normalized text in console for monitoring
  - Normalization pipeline: custom pronunciations → URLs → emails → phone numbers → years → times → ordinals → acronyms → general numbers
- **Court Response Formatting Overhaul**: Eliminated all markdown and complex formatting from voice responses for clean, natural TTS
  - Updated system prompt with critical formatting rules: "NEVER use ANY markdown formatting: no **, ***, *, __, [], (), etc."
  - Provided explicit correct/wrong format examples in system prompt to guide AI responses
  - Enhanced text cleaning function in both TTS endpoints to strip ALL markdown: triple asterisks (***), double asterisks (**), single asterisks (*), underscores (__, _), markdown links [text](url), standalone URLs in parentheses
  - Added comprehensive emoji removal for cleaner speech output
  - Result: Responses go from "**Email:** kaithalcourt@gov.in" to clean "Email: kaithalcourt@gov.in" for perfect TTS pronunciation
- **Court TTS Optimization**: Removed chunking system for continuous natural speech like normal assistants - text now processed in single ElevenLabs API call for smooth playback
- **Character Limit Protection**: Added 4500 character safety limit with intelligent sentence-boundary truncation to prevent ElevenLabs API failures on long responses
- **Enhanced Error Handling**: Implemented specific error messages for common TTS failures (413 text too long, 401/403 authentication, 429 rate limit) with detailed logging
- **ElevenLabs Settings Update**: Voice changed to "3AMU7jXQuQa3oRvRqUmb" with optimized parameters (stability: 0.55, similarity_boost: 0.7, style: 0.4) for better Hinglish pronunciation
- **Platform Rebranding**: Complete rebranding from "Re-Act" to "WayFinder.Ai" across all user-facing pages, documentation, and footer - maintaining consistent brand identity

### November 6, 2025
- **Court Admin General Info Enhancement**: Expanded General Info section with comprehensive court details including all contact information (Reception, PRO, Legal Aid), official email, website, working hours, and lunch break timings
- **Holidays Calendar System**: Implemented color-coded calendar with 4 holiday types (Gazetted Holiday - red, Restricted Holiday - orange, Weekly Off - blue, Vacation - green) with visual calendar display and management interface
- **AI-Powered Additional Information**: Added Additional Information section with dual modes - Manual entry and AI-assisted generation using GROQ_API_KEY (same as RKSD admin panel), featuring preview, edit, and regenerate capabilities
- **Backend API Routes**: Created `/api/court-admin/holidays`, `/api/court-admin/additional-info`, and `/api/court-admin/ai-generate` endpoints; data stored in `court_settings` table using JSON format with keys: 'court_holidays' and 'court_additional_info'
- **UI/UX Consistency**: All new features follow the RKSD admin panel pattern with EnhancedAIInput and EnhancedAIPreview components for consistent user experience

### November 5, 2025
- **Court Admin Login Fix**: Fixed authentication issue by generating proper bcrypt hash for default admin password ('admin123')
- **Schema Update**: Updated `court-admin-supabase-schema-fixed.sql` with correct password hash for `court_main_admin` table
- **Code Cleanup**: Removed duplicate/outdated `court-admin.tsx` file; `court-admin-main.tsx` is now the sole admin panel implementation
- **Documentation**: Created `COURT_ADMIN_LOGIN_FIX.md` with step-by-step instructions for database setup and login credentials

### November 4, 2025
- **Court Admin Panel**: Built comprehensive admin interface at `/court-admin` with purple gradient theme matching Court Assistant
- **Building Images Feature**: Admins can upload court building/location images with metadata; images automatically display in Court Assistant responses when users ask navigation/location questions
- **Enhanced Query Analyzer**: Court query analyzer now detects location-related questions and fetches relevant building images from database
- **Database Schema**: Added `court_building_images` table with fields for title, description, room_number, building_name, department, contact_person, and image_url
- **API Structure**: Court admin routes at `/api/court-admin/*` with placeholder mode for graceful operation when Supabase is not configured