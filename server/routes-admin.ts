import type { Express, Request, Response } from "express";
import { supabase } from "./supabase";
import { z } from "zod";

const courseSchema = z.object({
  course_name: z.string(),
  course_code: z.string(),
  course_type: z.string(),
  duration: z.string().optional(),
  description: z.string().optional(),
  eligibility: z.string().optional(),
  total_seats: z.string().optional(),
  fees_per_year: z.string().optional(),
  department_id: z.string().optional(),
});

const staffSchema = z.object({
  full_name: z.string(),
  employee_id: z.string().optional(),
  department_id: z.string().optional(),
  role: z.string().optional(),
  designation: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
  joining_date: z.string().optional(),
});

export function registerAdminRoutes(app: Express) {
  
  // Get admin stats
  app.get("/api/admin/stats", async (req: Request, res: Response) => {
    try {
      const [coursesResult, staffResult, departmentsResult] = await Promise.all([
        supabase.from('courses').select('count', { count: 'exact', head: true }),
        supabase.from('staff_members').select('count', { count: 'exact', head: true }),
        supabase.from('departments').select('count', { count: 'exact', head: true }),
      ]);

      res.json({
        students: 5200,
        courses: coursesResult.error?.code === '42P01' ? 0 : (coursesResult.count || 0),
        staff: staffResult.error?.code === '42P01' ? 0 : (staffResult.count || 0),
        departments: departmentsResult.error?.code === '42P01' ? 0 : (departmentsResult.count || 0),
      });
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // ===== COURSES ROUTES =====
  
  // Get all courses
  app.get("/api/admin/courses", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') return res.json({ courses: [] });
        throw error;
      }
      res.json({ courses: data });
    } catch (error: any) {
      console.error('Error fetching courses:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Create course
  app.post("/api/admin/courses", async (req: Request, res: Response) => {
    try {
      const validated = courseSchema.parse(req.body);

      const { data, error } = await supabase
        .from('courses')
        .insert({
          course_name: validated.course_name,
          course_code: validated.course_code,
          course_type: validated.course_type,
          duration: validated.duration,
          description: validated.description,
          eligibility: validated.eligibility,
          total_seats: validated.total_seats ? parseInt(validated.total_seats) : null,
          fees_per_year: validated.fees_per_year ? parseFloat(validated.fees_per_year) : null,
          department_id: validated.department_id || null,
        })
        .select()
        .single();

      if (error) {
        if (error.code === '42P01') return res.status(503).json({ message: "Courses table not yet created. Please run supabase-schema.sql in Supabase SQL Editor." });
        throw error;
      }
      res.json({ course: data });
    } catch (error: any) {
      console.error('Error creating course:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Update course
  app.put("/api/admin/courses/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validated = courseSchema.parse(req.body);

      const { data, error } = await supabase
        .from('courses')
        .update({
          course_name: validated.course_name,
          course_code: validated.course_code,
          course_type: validated.course_type,
          duration: validated.duration,
          description: validated.description,
          eligibility: validated.eligibility,
          total_seats: validated.total_seats ? parseInt(validated.total_seats) : null,
          fees_per_year: validated.fees_per_year ? parseFloat(validated.fees_per_year) : null,
          department_id: validated.department_id || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      res.json({ course: data });
    } catch (error: any) {
      console.error('Error updating course:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Delete course
  app.delete("/api/admin/courses/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (error) throw error;
      res.json({ message: 'Course deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting course:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // ===== STAFF ROUTES =====
  
  // Get all staff
  app.get("/api/admin/staff", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('staff_members')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42P01') return res.json({ staff: [] });
        throw error;
      }
      res.json({ staff: data });
    } catch (error: any) {
      console.error('Error fetching staff:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Create staff member
  app.post("/api/admin/staff", async (req: Request, res: Response) => {
    try {
      const validated = staffSchema.parse(req.body);

      // Auto-generate employee_id if not provided
      const { data: allStaff, error: fetchError } = await supabase
        .from('staff_members')
        .select('employee_id')
        .order('created_at', { ascending: false });

      if (fetchError && fetchError.code === '42P01') {
        return res.status(503).json({ message: "Staff table not yet created. Please run supabase-schema.sql in Supabase SQL Editor." });
      }

      const maxNumber = (allStaff || []).reduce((max: number, staff: any) => {
        const match = staff.employee_id?.match(/EMP-(\d+)/);
        if (match) {
          const num = parseInt(match[1]);
          return num > max ? num : max;
        }
        return max;
      }, 0);

      let employeeId = validated.employee_id?.trim() || `EMP-${String(maxNumber + 1).padStart(3, '0')}`;

      const { data, error } = await supabase
        .from('staff_members')
        .insert({
          full_name: validated.full_name,
          employee_id: employeeId,
          department_id: validated.department_id || null,
          role: validated.role || 'Staff',
          designation: validated.designation,
          email: validated.email,
          phone: validated.phone,
          qualification: validated.qualification,
          specialization: validated.specialization,
          joining_date: validated.joining_date || null,
        })
        .select()
        .single();

      if (error) throw error;
      res.json({ staff: data });
    } catch (error: any) {
      console.error('Error creating staff member:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Update staff member
  app.put("/api/admin/staff/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validated = staffSchema.parse(req.body);

      const { data, error } = await supabase
        .from('staff_members')
        .update({
          full_name: validated.full_name,
          employee_id: validated.employee_id,
          department_id: validated.department_id || null,
          role: validated.role || 'Staff',
          designation: validated.designation,
          email: validated.email,
          phone: validated.phone,
          qualification: validated.qualification,
          specialization: validated.specialization,
          joining_date: validated.joining_date || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      res.json({ staff: data });
    } catch (error: any) {
      console.error('Error updating staff member:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Delete staff member (HOD entry is protected — cannot be deleted)
  app.delete("/api/admin/staff/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Block deletion of HOD entry
      const { data: member } = await supabase
        .from('staff_members')
        .select('role')
        .eq('id', id)
        .single();

      if (member?.role === 'HOD') {
        return res.status(403).json({ message: 'Head of Department entry cannot be deleted. You can only edit it.' });
      }

      const { error } = await supabase
        .from('staff_members')
        .delete()
        .eq('id', id);

      if (error) throw error;
      res.json({ message: 'Staff member deleted successfully' });
    } catch (error: any) {
      console.error('Error deleting staff member:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get all departments (for dropdowns)
  app.get("/api/admin/departments", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name, slug, department_id, head_name, panel_link, is_active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json({ departments: data });
    } catch (error: any) {
      console.error('Error fetching departments:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // AI-powered information generation
  app.post("/api/admin/ai-generate-info", async (req: Request, res: Response) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ message: 'Prompt is required' });
      }

      const groqApiKey = process.env.GROQ_API_KEY_ADMIN;
      
      if (!groqApiKey) {
        return res.status(500).json({ message: 'Groq API key not configured for admin panel' });
      }

      const systemPrompt = `You are an AI assistant helping college administrators add structured information to their college management system. 

When given a description of one or more pieces of information to add, you must extract and structure it into the following JSON format:
{
  "entries": [
    {
      "title": "Clear, concise title for the information",
      "category": "Category (e.g., Facilities, Rules, Timings, Academics, Events, etc.)",
      "content": "Detailed, well-formatted content describing the information. Make it professional and clear.",
      "tags": ["relevant", "tags", "as", "array"]
    }
  ]
}

Guidelines:
- If MULTIPLE pieces of information are mentioned, create SEPARATE entries for EACH in the "entries" array
- If ONLY ONE piece of information is mentioned, still return an array with one entry
- Keep titles short and descriptive (max 50 characters)
- Choose appropriate categories based on the content
- Make content clear, professional, and detailed
- Add 2-5 relevant tags per entry
- If timings are mentioned, format them properly (e.g., 12:00 PM, 9:00 AM)
- Use proper grammar and formatting

EXAMPLES:
User: "Add library timings and canteen timings"
Response: {"entries": [{"title": "Library Timings", "category": "Facilities", ...}, {"title": "Canteen Timings", "category": "Facilities", ...}]}

Return ONLY the JSON object, no additional text or explanation.`;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2500,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Groq API error:', errorText);
        return res.status(500).json({ message: 'Failed to generate information with AI' });
      }

      const data = await response.json();
      const generatedText = data.choices[0]?.message?.content;

      if (!generatedText) {
        return res.status(500).json({ message: 'No response from AI' });
      }

      let parsedInfo;
      try {
        let cleanedText = generatedText.trim();
        if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
        }
        parsedInfo = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('Failed to parse AI response:', generatedText);
        return res.status(500).json({ message: 'AI response format error' });
      }

      res.json(parsedInfo);
    } catch (error: any) {
      console.error('Error in AI generation:', error);
      res.status(500).json({ message: error.message || 'Failed to generate information' });
    }
  });

  // AI-powered course generation
  app.post("/api/admin/ai-generate-course", async (req: Request, res: Response) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ message: 'Prompt is required' });
      }

      const groqApiKey = process.env.GROQ_API_KEY_ADMIN;
      
      if (!groqApiKey) {
        return res.status(500).json({ message: 'Groq API key not configured for admin panel' });
      }

      const systemPrompt = `You are an AI assistant helping college administrators add course information. 

When given a description of one or more courses, extract and structure it into this JSON format:
{
  "entries": [
    {
      "course_name": "Course name (e.g., B.Sc Computer Science)",
      "course_code": "Course code (e.g., BSC-CS-001) - generate if not provided",
      "course_type": "Type: UG, PG, Diploma, or Certificate",
      "duration": "Duration (e.g., 3 Years, 2 Years)",
      "description": "Detailed course description",
      "eligibility": "Eligibility criteria (e.g., 12th Pass with Science stream)",
      "total_seats": "Number of seats (as number, e.g., 60)",
      "fees_per_year": "Annual fees in rupees (as number, e.g., 25000)"
    }
  ]
}

IMPORTANT RULES:
1. If MULTIPLE courses are mentioned, create SEPARATE entries for EACH course in the "entries" array
2. If ONLY ONE course is mentioned, still return an array with one entry
3. Only fill fields if you are 90%+ confident about the information
4. If confidence is below 90%, leave that field as empty string "" or 0 for numbers
5. Always provide course_name, course_type if mentioned
6. Use proper formatting and professional language
7. For course_code: generate unique logical codes based on course name if not provided
8. total_seats and fees_per_year must be numbers (0 if unknown)

EXAMPLES:
User: "Add B.Sc CS and B.Sc Maths courses"
Response: {"entries": [{"course_name": "B.Sc Computer Science", "course_code": "BSC-CS-001", ...}, {"course_name": "B.Sc Mathematics", "course_code": "BSC-MATH-001", ...}]}

Return ONLY the JSON object, no additional text.`;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2500,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Groq API error:', errorText);
        return res.status(500).json({ message: 'Failed to generate course with AI' });
      }

      const data = await response.json();
      const generatedText = data.choices[0]?.message?.content;

      if (!generatedText) {
        return res.status(500).json({ message: 'No response from AI' });
      }

      let parsedCourse;
      try {
        let cleanedText = generatedText.trim();
        if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
        }
        parsedCourse = JSON.parse(cleanedText);
        
        if (parsedCourse.entries && Array.isArray(parsedCourse.entries)) {
          parsedCourse.entries = parsedCourse.entries.map((entry: any) => ({
            ...entry,
            total_seats: entry.total_seats?.toString() || "0",
            fees_per_year: entry.fees_per_year?.toString() || "0",
          }));
        }
      } catch (parseError) {
        console.error('Failed to parse AI response:', generatedText);
        return res.status(500).json({ message: 'AI response format error' });
      }

      res.json(parsedCourse);
    } catch (error: any) {
      console.error('Error in AI course generation:', error);
      res.status(500).json({ message: error.message || 'Failed to generate course' });
    }
  });

  // AI-powered staff generation
  app.post("/api/admin/ai-generate-staff", async (req: Request, res: Response) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ message: 'Prompt is required' });
      }

      const groqApiKey = process.env.GROQ_API_KEY_ADMIN;
      
      if (!groqApiKey) {
        return res.status(500).json({ message: 'Groq API key not configured for admin panel' });
      }

      const systemPrompt = `You are an AI assistant helping college administrators add staff member information.

When given a description of one or more staff members, extract and structure it into this JSON format:
{
  "entries": [
    {
      "full_name": "Full name of the staff member",
      "employee_id": "Employee ID (generate format EMP-XXX if not provided)",
      "role": "Role (Professor, Associate Professor, Assistant Professor, Lecturer, Lab Assistant, or Administrative Staff)",
      "designation": "Specific designation (e.g., Head of Department, Senior Lecturer)",
      "email": "Email address",
      "phone": "Phone number",
      "qualification": "Highest qualification (e.g., Ph.D., M.Sc., M.A.)",
      "specialization": "Area of expertise or specialization",
      "joining_date": "Joining date in YYYY-MM-DD format (leave empty if not provided)"
    }
  ]
}

IMPORTANT RULES:
1. If MULTIPLE staff members are mentioned, create SEPARATE entries for EACH person in the "entries" array
2. If ONLY ONE staff member is mentioned, still return an array with one entry
3. Only fill fields if you are 90%+ confident about the information
4. If confidence is below 90%, leave that field as empty string ""
5. Always provide full_name if mentioned
6. Generate unique employee_id in format EMP-001, EMP-002, etc. if not provided
7. For role: choose from the list provided, or use "Administrative Staff" if unsure
8. Use proper formatting and professional language
9. Format dates as YYYY-MM-DD

EXAMPLES:
User: "Add Ajay Kumar and Mohit Sharma as professors"
Response: {"entries": [{"full_name": "Ajay Kumar", "employee_id": "EMP-001", "role": "Professor", ...}, {"full_name": "Mohit Sharma", "employee_id": "EMP-002", "role": "Professor", ...}]}

Return ONLY the JSON object, no additional text.`;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2500,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Groq API error:', errorText);
        return res.status(500).json({ message: 'Failed to generate staff with AI' });
      }

      const data = await response.json();
      const generatedText = data.choices[0]?.message?.content;

      if (!generatedText) {
        return res.status(500).json({ message: 'No response from AI' });
      }

      let parsedStaff;
      try {
        let cleanedText = generatedText.trim();
        if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
        }
        parsedStaff = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('Failed to parse AI response:', generatedText);
        return res.status(500).json({ message: 'AI response format error' });
      }

      res.json(parsedStaff);
    } catch (error: any) {
      console.error('Error in AI staff generation:', error);
      res.status(500).json({ message: error.message || 'Failed to generate staff' });
    }
  });

  // AI-powered event generation
  app.post("/api/admin/ai-generate-event", async (req: Request, res: Response) => {
    try {
      const { prompt } = req.body;
      
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ message: 'Prompt is required' });
      }

      const groqApiKey = process.env.GROQ_API_KEY_ADMIN;
      
      if (!groqApiKey) {
        return res.status(500).json({ message: 'Groq API key not configured for admin panel' });
      }

      const systemPrompt = `You are an AI assistant helping college administrators add event information.

When given a description of one or more events or notices, extract and structure it into this JSON format:
{
  "entries": [
    {
      "title": "Event title (clear and concise)",
      "description": "Detailed, well-formatted event description with emojis for visual appeal",
      "event_type": "Type (Cultural, Academic, Sports, Technical, Notice, etc.)",
      "event_date": "Event date-time in ISO format YYYY-MM-DDTHH:MM (leave empty if not provided)",
      "location": "Event venue/location",
      "formatted_message": "A beautiful, professional formatted message for landing page with relevant emojis (📅 🎉 🏆 📚 etc.)"
    }
  ]
}

IMPORTANT RULES:
1. If MULTIPLE events are mentioned, create SEPARATE entries for EACH event in the "entries" array
2. If ONLY ONE event is mentioned, still return an array with one entry
3. Only fill fields if you are 90%+ confident about the information
4. If confidence is below 90%, leave that field as empty string ""
5. Always provide title and event_type if mentioned
6. Make formatted_message attractive with emojis and proper formatting
7. For dates: use ISO format YYYY-MM-DDTHH:MM (e.g., 2025-12-10T14:00)
8. Make description professional and informative
9. Use appropriate emojis: 📅 for dates, 📍 for location, 🎉 for celebrations, 🏆 for competitions, 📚 for academic, etc.

EXAMPLES:
User: "Add Sports Day on Dec 20 and Annual Function on Dec 25"
Response: {"entries": [{"title": "Sports Day", "event_date": "2025-12-20T09:00", ...}, {"title": "Annual Function", "event_date": "2025-12-25T10:00", ...}]}

Return ONLY the JSON object, no additional text.`;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2500,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Groq API error:', errorText);
        return res.status(500).json({ message: 'Failed to generate event with AI' });
      }

      const data = await response.json();
      const generatedText = data.choices[0]?.message?.content;

      if (!generatedText) {
        return res.status(500).json({ message: 'No response from AI' });
      }

      let parsedEvent;
      try {
        let cleanedText = generatedText.trim();
        if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
        }
        parsedEvent = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('Failed to parse AI response:', generatedText);
        return res.status(500).json({ message: 'AI response format error' });
      }

      res.json(parsedEvent);
    } catch (error: any) {
      console.error('Error in AI event generation:', error);
      res.status(500).json({ message: error.message || 'Failed to generate event' });
    }
  });

  // Smart AI endpoint - Detects UPDATE vs CREATE and handles both intelligently
  app.post("/api/admin/ai-smart-generate", async (req: Request, res: Response) => {
    try {
      const { prompt, sectionType } = req.body;
      
      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ message: 'Prompt is required' });
      }
      
      if (!sectionType) {
        return res.status(400).json({ message: 'Section type is required' });
      }

      const groqApiKey = process.env.GROQ_API_KEY_ADMIN;
      
      if (!groqApiKey) {
        return res.status(500).json({ message: 'Groq API key not configured for admin panel' });
      }

      // Fetch existing data based on section type
      let existingData: any[] = [];
      let tableName = '';
      
      switch(sectionType) {
        case 'courses':
          tableName = 'courses';
          const coursesResult = await supabase.from('courses').select('*');
          existingData = coursesResult.data || [];
          break;
        case 'staff':
          tableName = 'staff_members';
          const staffResult = await supabase.from('staff_members').select('*');
          existingData = staffResult.data || [];
          break;
        case 'general_info':
          tableName = 'college_settings';
          const settingsResult = await supabase.from('college_settings').select('*');
          existingData = settingsResult.data || [];
          break;
        case 'events':
          tableName = 'events';
          const eventsResult = await supabase.from('events').select('*');
          existingData = eventsResult.data || [];
          break;
        default:
          return res.status(400).json({ message: 'Invalid section type' });
      }

      // Smart AI prompt that detects intent and matches entries
      const systemPrompt = `You are an intelligent AI assistant for a college management system. Your job is to analyze user requests and determine if they want to:
1. CREATE new entry/entries
2. UPDATE existing entry/entries

EXISTING DATA IN ${sectionType.toUpperCase()} SECTION:
${JSON.stringify(existingData, null, 2)}

IMPORTANT INSTRUCTIONS:
- Carefully analyze the user's prompt in ANY LANGUAGE (English, Hindi, Hinglish, etc.)
- Detect UPDATE intent from keywords like: "change", "update", "modify", "edit", "correct", "fix", "set", "make it", "badlo", "badal do", "change kro", "kar do", "theek kro", "sahi kro", etc.
- Be SMART about fuzzy matching - match on keywords, partial names, meanings, not just exact strings
- For college_settings (general_info), the data has a 'value' JSONB field containing {title, content, category}
- When matching, look inside the 'value' field for title/content/category
- If updating, find the BEST MATCHING entry from existing data and return the COMPLETE entry object
- Be intelligent about understanding what the user wants - "library timing 9 am kar do" means find library-related entry and update its timing/content

OUTPUT FORMAT:
Return a JSON object with this exact structure:
{
  "operation": "create" | "update",
  "confidence": <0-100 number indicating how confident you are>,
  "matched_entry": <the COMPLETE existing entry object if operation is "update", including id, key, value fields - null otherwise>,
  "changes": {
    <field_name>: {
      "old": <old value from existing data>,
      "new": <new value to be set>
    }
  },
  "entries": [<array of new entries if operation is "create">],
  "explanation": "<brief explanation in user's language of what you understood>"
}

EXAMPLES:

Example 1 - UPDATE (general_info with value JSONB field):
User: "library timing change kar ke 9 am kar do"
Existing has: {"id": "uuid-123", "key": "library_timings", "value": {"title": "Library Timings", "content": "8:00 AM to 6:00 PM", "category": "facilities"}, "updated_at": "..."}
Response: {
  "operation": "update",
  "confidence": 95,
  "matched_entry": {"id": "uuid-123", "key": "library_timings", "value": {"title": "Library Timings", "content": "8:00 AM to 6:00 PM", "category": "facilities"}, "updated_at": "..."},
  "changes": {
    "content": {
      "old": "8:00 AM to 6:00 PM",
      "new": "9:00 AM to 6:00 PM"
    }
  },
  "entries": [],
  "explanation": "Library ka opening time 8 AM se 9 AM kar raha hu"
}

Example 2 - UPDATE (Staff with direct fields):
User: "Mr. Ajay physical department ka contact number 9876543210 kar do"
Existing has: {"id": "uuid-456", "full_name": "Ajay Kumar", "designation": "Teacher", "role": "Physical Education", "phone": "9999999999", ...}
Response: {
  "operation": "update",
  "confidence": 90,
  "matched_entry": {"id": "uuid-456", "full_name": "Ajay Kumar", "designation": "Teacher", "role": "Physical Education", "phone": "9999999999", ...},
  "changes": {
    "phone": {
      "old": "9999999999",
      "new": "9876543210"
    }
  },
  "entries": [],
  "explanation": "Ajay Kumar ka phone number update kar raha hu"
}

Example 3 - CREATE:
User: "Add canteen timings: 8 AM to 8 PM"
Response: {
  "operation": "create",
  "confidence": 100,
  "matched_entry": null,
  "changes": {},
  "entries": [{"title": "Canteen Timings", "content": "8:00 AM to 8:00 PM", "category": "facilities"}],
  "explanation": "Naya canteen timing entry add kar raha hu"
}

Example 4 - UPDATE (Smart Understanding):
User: "library 2 pm close hota h usko 6 pm kro"
Existing has: {"id": "uuid-789", "key": "lib_hours", "value": {"title": "Library Hours", "content": "Monday to Friday: 9 AM to 2 PM. Weekends closed.", "category": "timings"}, "updated_at": "..."}
Response: {
  "operation": "update",
  "confidence": 88,
  "matched_entry": {"id": "uuid-789", "key": "lib_hours", "value": {"title": "Library Hours", "content": "Monday to Friday: 9 AM to 2 PM. Weekends closed.", "category": "timings"}, "updated_at": "..."},
  "changes": {
    "content": {
      "old": "Monday to Friday: 9 AM to 2 PM. Weekends closed.",
      "new": "Monday to Friday: 9 AM to 6 PM. Weekends closed."
    }
  },
  "entries": [],
  "explanation": "Library closing time ko 2 PM se 6 PM update kar raha hu"
}

CRITICAL RULES:
- For UPDATE: Return the COMPLETE matched_entry object exactly as it exists in the database (with all fields: id, key, value, etc.)
- For UPDATE in college_settings: The changes should refer to fields inside the "value" object (title, content, category)
- For UPDATE: changes should only include fields that are being modified
- For CREATE: return properly formatted entries array
- Always include confidence score (0-100)
- Be VERY smart about fuzzy matching: "library" matches "Library Timings", "Library Hours", "lib", etc.
- Understand the intent, not just keywords: "9 am kar do", "set to 9 am", "change to 9", "9 baje kro" all mean the same
- Return ONLY valid JSON, no extra text or markdown`;

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          temperature: 0.3, // Lower temperature for more deterministic results
          max_tokens: 3000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Groq API error:', errorText);
        return res.status(500).json({ message: 'Failed to process with AI' });
      }

      const data = await response.json();
      const generatedText = data.choices[0]?.message?.content;

      if (!generatedText) {
        return res.status(500).json({ message: 'No response from AI' });
      }

      let parsedResponse;
      try {
        let cleanedText = generatedText.trim();
        if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
        }
        parsedResponse = JSON.parse(cleanedText);
        
        // Add section type to response
        parsedResponse.sectionType = sectionType;
        
        console.log('Smart AI Response:', JSON.stringify(parsedResponse, null, 2));
      } catch (parseError) {
        console.error('Failed to parse AI response:', generatedText);
        return res.status(500).json({ message: 'AI response format error' });
      }

      res.json(parsedResponse);
    } catch (error: any) {
      console.error('Error in smart AI generation:', error);
      res.status(500).json({ message: error.message || 'Failed to process request' });
    }
  });

  // Helper function to parse time-based queries with precision
  function parseTimeQuery(message: string, timeframe: string): { startDate: Date | null; endDate: Date | null; description: string; isSingleUpdate: boolean } {
    const now = new Date();
    const msgLower = message.toLowerCase();
    
    // Check for "last update" or "last time" (singular) = most recent single update
    if (msgLower.match(/\b(last update|last time|latest update|most recent|sabse latest)\b/) && 
        !msgLower.match(/\b(updates|last \d+|in last|past \d+)\b/)) {
      return {
        startDate: null,
        endDate: now,
        description: 'most recent single update',
        isSingleUpdate: true
      };
    }
    
    // Yesterday at specific time (e.g., "yesterday at 2pm", "kal 4 baje")
    const yesterdayTimeMatch = msgLower.match(/\b(yesterday|kal)\s+(?:at\s+)?(\d+)\s*(am|pm|baje)?\b/i);
    if (yesterdayTimeMatch) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const hour = parseInt(yesterdayTimeMatch[2]);
      const isPM = yesterdayTimeMatch[3]?.toLowerCase().includes('pm') || yesterdayTimeMatch[3]?.toLowerCase().includes('baje');
      yesterday.setHours(isPM && hour !== 12 ? hour + 12 : hour, 0, 0, 0);
      const endTime = new Date(yesterday);
      endTime.setHours(yesterday.getHours() + 1);
      return {
        startDate: yesterday,
        endDate: endTime,
        description: `yesterday at ${hour}${yesterdayTimeMatch[3] || ''}`,
        isSingleUpdate: false
      };
    }
    
    // Yesterday (full day)
    if (msgLower.match(/\b(yesterday|kal)\b/) && !msgLower.match(/\bday before yesterday|parso\b/)) {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      const endYesterday = new Date(yesterday);
      endYesterday.setHours(23, 59, 59, 999);
      return {
        startDate: yesterday,
        endDate: endYesterday,
        description: 'yesterday (full day)',
        isSingleUpdate: false
      };
    }
    
    // Day before yesterday / parso
    if (msgLower.match(/\b(day before yesterday|parso|2 days ago)\b/)) {
      const dayBefore = new Date(now);
      dayBefore.setDate(dayBefore.getDate() - 2);
      dayBefore.setHours(0, 0, 0, 0);
      const endDayBefore = new Date(dayBefore);
      endDayBefore.setHours(23, 59, 59, 999);
      return {
        startDate: dayBefore,
        endDate: endDayBefore,
        description: 'day before yesterday',
        isSingleUpdate: false
      };
    }
    
    // Last X hours
    const hoursMatch = msgLower.match(/\b(?:last|past)\s+(\d+)\s+(?:hours?|ghante)\b/);
    if (hoursMatch) {
      const hours = parseInt(hoursMatch[1]);
      const startDate = new Date(now.getTime() - hours * 60 * 60 * 1000);
      return {
        startDate,
        endDate: now,
        description: `last ${hours} hours`,
        isSingleUpdate: false
      };
    }
    
    // Last X days
    const daysMatch = msgLower.match(/\b(?:last|past)\s+(\d+)\s+(?:days?|din)\b/);
    if (daysMatch) {
      const days = parseInt(daysMatch[1]);
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);
      return {
        startDate,
        endDate: now,
        description: `last ${days} days`,
        isSingleUpdate: false
      };
    }
    
    // Last X months
    const monthsMatch = msgLower.match(/\b(?:last|past)\s+(\d+)\s+(?:months?|mahine)\b/);
    if (monthsMatch) {
      const months = parseInt(monthsMatch[1]);
      const startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - months);
      startDate.setHours(0, 0, 0, 0);
      return {
        startDate,
        endDate: now,
        description: `last ${months} months`,
        isSingleUpdate: false
      };
    }
    
    // Last week
    if (msgLower.match(/\b(?:last|past)\s+week\b/)) {
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
      return {
        startDate,
        endDate: now,
        description: 'last week',
        isSingleUpdate: false
      };
    }
    
    // Last month
    if (msgLower.match(/\b(?:last|past)\s+month\b/)) {
      const startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 1);
      startDate.setHours(0, 0, 0, 0);
      return {
        startDate,
        endDate: now,
        description: 'last month',
        isSingleUpdate: false
      };
    }
    
    // Default: "last updates" without specific time = last 24 hours
    if (msgLower.match(/\b(updates|recent|latest changes)\b/)) {
      const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      return {
        startDate,
        endDate: now,
        description: 'last 24 hours',
        isSingleUpdate: false
      };
    }
    
    // Fallback based on timeframe from classification
    const timeframeNum = parseInt(timeframe) || 10;
    const startDate = new Date(now);
    startDate.setDate(startDate.getDate() - timeframeNum);
    startDate.setHours(0, 0, 0, 0);
    return {
      startDate,
      endDate: now,
      description: `last ${timeframeNum} days`,
      isSingleUpdate: false
    };
  }

  // Data Query Assistant - Helps locate and track college data
  app.post("/api/admin/ai-control", async (req: Request, res: Response) => {
    try {
      const { message, conversationHistory = [] } = req.body;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ message: 'Message is required' });
      }

      const groqApiKey = process.env.GROQ_API_KEY_ADMIN;

      if (!groqApiKey) {
        return res.status(500).json({ message: 'Groq API key not configured' });
      }

      // STEP 1: Intent Classification
      console.log('[Data Query] Step 1: Classifying intent...');
      const classificationPrompt = `You are a data query assistant for RKSD College management system. Classify the user's query intent.

SYSTEM STRUCTURE:
- STAFF section: Staff member information (name, designation, role, department)
- COURSES section: Course information (name, code, type, fees, seats, duration)
- EVENTS section: Events and activities (title, description, date, type, location)
- GENERAL INFO section: College information (principal, facilities, library timings, rules, contact info)
- DEPARTMENTS section: Department information (name, description, head information)

Classify the user's request into one of these intents:
1. LOCATE_DATA: Find where specific data is stored (e.g., "where is Mr. Ajay?", "where are library timings?")
2. QUERY_SPECIFIC: Ask for specific information (e.g., "what is principal name?", "show staff details", "total departments")
3. QUERY_UPDATES: Ask about recent updates (e.g., "what was last updated?", "updates in last 10 days", "yesterday updates")
4. QUERY_MISSING: Ask about missing or incomplete data (e.g., "departments missing head info", "which facilities need updating")
5. QUERY_IMPROVEMENTS: Ask for improvement suggestions (e.g., "what can be improved?", "check for issues")
6. GENERAL_HELP: General greetings or help requests

Response Format:
{
  "intent": "LOCATE_DATA|QUERY_SPECIFIC|QUERY_UPDATES|QUERY_MISSING|QUERY_IMPROVEMENTS|GENERAL_HELP",
  "section": "courses|staff|events|general_info|departments|all|none",
  "searchTerm": "specific name or item being searched for",
  "timeframe": "for update queries, detected time period",
  "specificQuery": "what specifically is being asked (e.g., 'total count', 'missing head', 'facilities updated')"
}

Return ONLY the JSON object.`;

      const classificationMessages = [
        { role: "system", content: classificationPrompt },
        { role: "user", content: message }
      ];

      const classificationResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: classificationMessages,
          temperature: 0.2,
          max_tokens: 500,
        }),
      });

      if (!classificationResponse.ok) {
        throw new Error('Intent classification failed');
      }

      const classificationData = await classificationResponse.json();
      let classification;
      try {
        let cleanedText = classificationData.choices[0]?.message?.content.trim();
        if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
        }
        classification = JSON.parse(cleanedText);
      } catch (e) {
        throw new Error('Failed to parse classification');
      }

      console.log('[Data Query] Classification:', classification);

      // STEP 2: Fetch REAL data from database based on intent
      let contextData = '';
      let dataWithPositions: any = null;
      let realCounts: any = null;
      let deterministicResponse: string | null = null;

      if (classification.intent === 'LOCATE_DATA') {
        // Fetch data with row numbers to help locate specific items
        const searchTerm = classification.searchTerm?.toLowerCase() || '';
        
        if (classification.section === 'staff' || classification.section === 'all') {
          const { data } = await supabase
            .from('staff_members')
            .select('id, full_name, designation, role, created_at, updated_at')
            .order('created_at', { ascending: true });
          
          if (data) {
            dataWithPositions = { staff: data.map((item, idx) => ({ ...item, position: idx + 1 })) };
          }
        } else if (classification.section === 'general_info' || classification.section === 'all') {
          const { data } = await supabase
            .from('college_settings')
            .select('id, key, value, updated_at')
            .order('key', { ascending: true });
          
          if (data) {
            if (!dataWithPositions) dataWithPositions = {};
            dataWithPositions.general_info = data.map((item, idx) => ({ ...item, position: idx + 1 }));
          }
        } else if (classification.section === 'courses' || classification.section === 'all') {
          const { data } = await supabase
            .from('courses')
            .select('id, course_name, course_code, course_type, created_at, updated_at')
            .order('created_at', { ascending: true });
          
          if (data) {
            if (!dataWithPositions) dataWithPositions = {};
            dataWithPositions.courses = data.map((item, idx) => ({ ...item, position: idx + 1 }));
          }
        } else if (classification.section === 'events' || classification.section === 'all') {
          const { data } = await supabase
            .from('events')
            .select('id, title, event_type, event_date, created_at, updated_at')
            .order('created_at', { ascending: true });
          
          if (data) {
            if (!dataWithPositions) dataWithPositions = {};
            dataWithPositions.events = data.map((item, idx) => ({ ...item, position: idx + 1 }));
          }
        }
        
        contextData = JSON.stringify(dataWithPositions, null, 2);
        
      } else if (classification.intent === 'QUERY_SPECIFIC') {
        // Fetch specific information - ALWAYS use real database counts
        if (!realCounts) realCounts = {};
        
        // Check if this is a COUNT query with comprehensive Hindi/English/Urdu variants
        // Includes: Latin transliterations, Devanagari (कितने/कितनी/कुल), Urdu (کتنے/کتنی/کل)
        const isCountQuery = message.toLowerCase().match(/\b(total|kitne|kitna|kitni|kitnay|kul|how many|count|number of|quantity)\b|कितने|कितनी|कितना|कुल|کتنے|کتنی|کتنا|کل/);
        
        if (classification.section === 'staff' || classification.section === 'all') {
          const { data, count } = await supabase.from('staff_members').select('full_name, designation, role, department', { count: 'exact' });
          realCounts.staff_count = count || 0;
          contextData += JSON.stringify({ staff: data, total_staff: count || 0 }, null, 2);
        }
        if (classification.section === 'general_info' || classification.section === 'all') {
          const { data } = await supabase.from('college_settings').select('key, value');
          contextData += JSON.stringify({ general_info: data }, null, 2);
        }
        if (classification.section === 'courses' || classification.section === 'all') {
          const { data, count } = await supabase.from('courses').select('course_name, course_code, course_type, fees_per_year', { count: 'exact' });
          realCounts.courses_count = count || 0;
          contextData += JSON.stringify({ courses: data, total_courses: count || 0 }, null, 2);
        }
        if (classification.section === 'events' || classification.section === 'all') {
          const { data, count } = await supabase.from('events').select('title, event_type, event_date, location', { count: 'exact' });
          realCounts.events_count = count || 0;
          contextData += JSON.stringify({ events: data, total_events: count || 0 }, null, 2);
        }
        if (classification.section === 'departments' || classification.section === 'all') {
          const { data, count } = await supabase.from('departments').select('id, name, description, head_name, head_email, head_phone', { count: 'exact' });
          realCounts.departments_count = count || 0;
          contextData += JSON.stringify({ departments: data, total_departments: count || 0 }, null, 2);
        }
        
        // DETERMINISTIC COUNT RESPONSE: Build response directly from database counts
        // Works for specific section OR section="all" (infer from query keywords)
        if (isCountQuery) {
          // Map query keywords to specific sections (covers Latin, Devanagari, Urdu)
          const msgLower = message.toLowerCase();
          const inferredSection = 
            msgLower.match(/department|vibhag|विभाग|विभागों|شعبہ|شعبے/) ? 'departments' :
            msgLower.match(/staff|teacher|faculty|shikshak|adhyapak|शिक्षक|अध्यापक|कर्मचारी|اساتذہ|استاد/) ? 'staff' :
            msgLower.match(/course|pathyakram|पाठ्यक्रम|कोर्स|کورس|کورسز/) ? 'courses' :
            msgLower.match(/event|karyakram|कार्यक्रम|इवेंट|ایونٹ|تقریب/) ? 'events' :
            classification.section !== 'all' ? classification.section : null;
          
          if (inferredSection === 'departments' && realCounts.departments_count !== undefined) {
            deterministicResponse = `✅ आपके system में currently **${realCounts.departments_count} department${realCounts.departments_count !== 1 ? 's' : ''}** ${realCounts.departments_count === 1 ? 'है' : 'हैं'} (DEPARTMENTS section में)।`;
          } else if (inferredSection === 'staff' && realCounts.staff_count !== undefined) {
            deterministicResponse = `✅ आपके system में currently **${realCounts.staff_count} staff member${realCounts.staff_count !== 1 ? 's' : ''}** ${realCounts.staff_count === 1 ? 'है' : 'हैं'} (STAFF section में)।`;
          } else if (inferredSection === 'courses' && realCounts.courses_count !== undefined) {
            deterministicResponse = `✅ आपके system में currently **${realCounts.courses_count} course${realCounts.courses_count !== 1 ? 's' : ''}** ${realCounts.courses_count === 1 ? 'है' : 'हैं'} (COURSES section में)।`;
          } else if (inferredSection === 'events' && realCounts.events_count !== undefined) {
            deterministicResponse = `✅ आपके system में currently **${realCounts.events_count} event${realCounts.events_count !== 1 ? 's' : ''}** ${realCounts.events_count === 1 ? 'है' : 'हैं'} (EVENTS section में)।`;
          } else if (classification.section === 'all' || !inferredSection) {
            // User asked for counts but didn't specify which - show all counts
            const parts = [];
            if (realCounts.departments_count !== undefined) {
              parts.push(`📚 **${realCounts.departments_count} department${realCounts.departments_count !== 1 ? 's' : ''}**`);
            }
            if (realCounts.staff_count !== undefined) {
              parts.push(`👥 **${realCounts.staff_count} staff member${realCounts.staff_count !== 1 ? 's' : ''}**`);
            }
            if (realCounts.courses_count !== undefined) {
              parts.push(`📖 **${realCounts.courses_count} course${realCounts.courses_count !== 1 ? 's' : ''}**`);
            }
            if (realCounts.events_count !== undefined) {
              parts.push(`🎉 **${realCounts.events_count} event${realCounts.events_count !== 1 ? 's' : ''}**`);
            }
            if (parts.length > 0) {
              deterministicResponse = `✅ आपके system में currently:\n\n${parts.join('\n')}`;
            }
          }
          
          if (deterministicResponse) {
            console.log('[Data Query] DETERMINISTIC COUNT RESPONSE (bypassing LLM):', deterministicResponse);
          }
        }
        
      } else if (classification.intent === 'QUERY_UPDATES') {
        // Use precise time parsing for updates
        const timeInfo = parseTimeQuery(message, classification.timeframe || '');
        console.log('[Data Query] Time parsing result:', timeInfo);
        
        if (timeInfo.isSingleUpdate) {
          // Get THE most recent single update across all tables
          const [staffLatest, courseLatest, eventLatest, deptLatest, generalLatest] = await Promise.all([
            supabase.from('staff_members').select('full_name, updated_at, created_at').order('updated_at', { ascending: false }).limit(1),
            supabase.from('courses').select('course_name, updated_at, created_at').order('updated_at', { ascending: false }).limit(1),
            supabase.from('events').select('title, updated_at, created_at').order('updated_at', { ascending: false }).limit(1),
            supabase.from('departments').select('name, updated_at, created_at').order('updated_at', { ascending: false }).limit(1),
            supabase.from('college_settings').select('key, value, updated_at').order('updated_at', { ascending: false }).limit(1)
          ]);
          
          const allUpdates = [
            ...(staffLatest.data?.map(d => ({ ...d, section: 'STAFF', item_name: d.full_name })) || []),
            ...(courseLatest.data?.map(d => ({ ...d, section: 'COURSES', item_name: d.course_name })) || []),
            ...(eventLatest.data?.map(d => ({ ...d, section: 'EVENTS', item_name: d.title })) || []),
            ...(deptLatest.data?.map(d => ({ ...d, section: 'DEPARTMENTS', item_name: d.name })) || []),
            ...(generalLatest.data?.map(d => ({ ...d, section: 'GENERAL INFO', item_name: d.key })) || [])
          ].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
          
          const mostRecent = allUpdates[0];
          contextData = JSON.stringify({
            query_type: 'single_most_recent_update',
            most_recent_update: mostRecent || null
          }, null, 2);
          
        } else if (timeInfo.startDate) {
          // Get updates within specific time range
          const startISO = timeInfo.startDate.toISOString();
          const endISO = timeInfo.endDate?.toISOString() || new Date().toISOString();
          
          const [staffUpdates, courseUpdates, eventUpdates, deptUpdates, generalUpdates] = await Promise.all([
            supabase.from('staff_members').select('full_name, updated_at, created_at').gte('updated_at', startISO).lte('updated_at', endISO).order('updated_at', { ascending: false }),
            supabase.from('courses').select('course_name, updated_at, created_at').gte('updated_at', startISO).lte('updated_at', endISO).order('updated_at', { ascending: false }),
            supabase.from('events').select('title, updated_at, created_at').gte('updated_at', startISO).lte('updated_at', endISO).order('updated_at', { ascending: false }),
            supabase.from('departments').select('name, updated_at, created_at').gte('updated_at', startISO).lte('updated_at', endISO).order('updated_at', { ascending: false }),
            supabase.from('college_settings').select('key, value, updated_at').gte('updated_at', startISO).lte('updated_at', endISO).order('updated_at', { ascending: false })
          ]);
          
          contextData = JSON.stringify({
            query_type: 'time_range_updates',
            timeframe_description: timeInfo.description,
            start_date: startISO,
            end_date: endISO,
            staff_updates: staffUpdates.data || [],
            course_updates: courseUpdates.data || [],
            event_updates: eventUpdates.data || [],
            department_updates: deptUpdates.data || [],
            general_info_updates: generalUpdates.data || []
          }, null, 2);
        }
        
      } else if (classification.intent === 'QUERY_MISSING') {
        // Check for missing or incomplete data
        if (classification.section === 'departments' || classification.section === 'all') {
          const { data: depts } = await supabase.from('departments').select('id, name, description, head_name, head_email, head_phone');
          const missingHead = depts?.filter(d => !d.head_name || !d.head_email) || [];
          contextData += JSON.stringify({ departments_missing_head: missingHead }, null, 2);
        }
        if (classification.section === 'staff' || classification.section === 'all') {
          const { data: staff } = await supabase.from('staff_members').select('id, full_name, designation, department');
          const missingDept = staff?.filter(s => !s.department) || [];
          contextData += JSON.stringify({ staff_missing_department: missingDept }, null, 2);
        }
        if (classification.section === 'general_info' || classification.section === 'all') {
          const { data: settings } = await supabase.from('college_settings').select('key, value');
          const emptySettings = settings?.filter(s => !s.value || s.value.trim() === '') || [];
          contextData += JSON.stringify({ general_info_empty_values: emptySettings }, null, 2);
        }
        
      } else if (classification.intent === 'QUERY_IMPROVEMENTS') {
        // Analyze all data for potential improvements
        const [depts, staff, courses, events, settings] = await Promise.all([
          supabase.from('departments').select('*', { count: 'exact' }),
          supabase.from('staff_members').select('*', { count: 'exact' }),
          supabase.from('courses').select('*', { count: 'exact' }),
          supabase.from('events').select('*', { count: 'exact' }),
          supabase.from('college_settings').select('*')
        ]);
        
        const issues = [];
        
        // Check for departments missing head info
        const deptsWithoutHead = depts.data?.filter(d => !d.head_name || !d.head_email) || [];
        if (deptsWithoutHead.length > 0) {
          issues.push(`${deptsWithoutHead.length} departments missing head information`);
        }
        
        // Check for staff without department
        const staffWithoutDept = staff.data?.filter(s => !s.department) || [];
        if (staffWithoutDept.length > 0) {
          issues.push(`${staffWithoutDept.length} staff members without assigned department`);
        }
        
        // Check for empty settings
        const emptySettings = settings.data?.filter(s => !s.value || s.value.trim() === '') || [];
        if (emptySettings.length > 0) {
          issues.push(`${emptySettings.length} general info fields are empty`);
        }
        
        // Check for old events that should be archived
        const now = new Date();
        const oldEvents = events.data?.filter(e => new Date(e.event_date) < now) || [];
        if (oldEvents.length > 5) {
          issues.push(`${oldEvents.length} past events could be archived`);
        }
        
        contextData = JSON.stringify({
          total_departments: depts.count || 0,
          total_staff: staff.count || 0,
          total_courses: courses.count || 0,
          total_events: events.count || 0,
          identified_issues: issues,
          departments_without_head: deptsWithoutHead.map(d => d.name),
          staff_without_department: staffWithoutDept.map(s => s.full_name)
        }, null, 2);
      }

      // STEP 3: Generate response - Use deterministic response if available, otherwise use LLM
      if (deterministicResponse) {
        // Short-circuit: Return deterministic response directly without LLM
        console.log('[Data Query] Using DETERMINISTIC response (bypassing LLM)');
        return res.json({
          success: true,
          response: deterministicResponse,
          intent: classification.intent,
          dataChanged: false,
          requiresConfirmation: false
        });
      }
      
      const responsePrompt = `You are a Data Query Assistant for RKSD College's system. You help users locate and understand their college data.

**CRITICAL RULE: ONLY use data from the AVAILABLE DATA section below. NEVER make up numbers, counts, or information. If data is not available, say so clearly.**

SYSTEM STRUCTURE:
- STAFF section: Staff member information (name, designation, role, department)
- COURSES section: Course information (name, code, type, fees, seats, duration)
- EVENTS section: Events and activities (title, description, date, type, location)
- GENERAL INFO section: College information stored in key-value pairs (principal, facilities, library_timings, contact_info, etc.)
- DEPARTMENTS section: Department information (name, description, head information)

AVAILABLE DATA (THIS IS THE ONLY REAL DATA - USE ONLY THIS):
${contextData}

User Request: ${message}
Intent: ${classification.intent}
Section: ${classification.section}
Search Term: ${classification.searchTerm || 'N/A'}

Response Format:
{
  "intent": "${classification.intent}",
  "response": "Human-friendly response in Hindi/English mix",
  "foundLocation": "where the data is located (if applicable)",
  "position": "row number or position (if applicable)"
}

GUIDELINES FOR RESPONSES:

1. LOCATE_DATA: Help find where specific data is stored
   - Example: "Mr. Ajay from Physical department STAFF section में position #103 पर है"
   - Example: "Library timings GENERAL INFO section में 'library_timings' key के under position #3 पर stored है"
   - Be specific about section name and position number

2. QUERY_SPECIFIC: Provide ONLY the exact information from AVAILABLE DATA
   - For counts (total departments, total courses, etc.): Use ONLY the "total_departments", "total_courses" values from the data
   - Example: If data shows "total_departments: 1", say "आपके system में currently 1 department है"
   - NEVER guess or estimate - if count is 0, say 0, if data shows 1, say 1
   - Example: "Principal का name [exact name from data] है जो GENERAL INFO section में stored है"

3. QUERY_UPDATES: Show ONLY actual updates from the data
   - For "single_most_recent_update": Show the ONE most recent update only
   - For "time_range_updates": Show all updates in that exact timeframe
   - If NO updates found in timeframe, clearly say "कोई update नहीं हुआ था"
   - Example: "Last 24 hours में: [list exact updates with timestamps]"
   - Example: "Yesterday at 2pm कोई update नहीं हुआ था"

4. QUERY_MISSING: Report ONLY actual missing data from AVAILABLE DATA
   - Example: "ये departments missing head info: [exact list from data]"
   - If nothing missing, say "सब complete है, कोई missing data नहीं है"

5. QUERY_IMPROVEMENTS: Suggest improvements based on identified_issues from data
   - Only mention issues that are in the "identified_issues" array
   - Give specific counts and details from the data
   - Example: "आप इन चीजों को improve कर सकते हैं: [list from identified_issues]"

6. GENERAL_HELP: Provide helpful information about the system
   - Explain what you can help with
   - Give examples of questions they can ask

**IMPORTANT:**
- Use emojis to make responses friendly
- Mix Hindi and English naturally (Hinglish)
- NEVER say approximate numbers - use exact counts from data
- If data shows 0 or empty array, say "नहीं है" or "कोई नहीं" 
- Always mention the exact section name when locating data

Return ONLY the JSON object.`;

      const responseMessages = [
        { role: "system", content: responsePrompt },
        ...conversationHistory.slice(-4).map((msg: any) => ({
          role: msg.role,
          content: msg.content
        })),
        { role: "user", content: message }
      ];

      const finalResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: responseMessages,
          temperature: 0.3,
          max_tokens: 2000,
        }),
      });

      if (!finalResponse.ok) {
        throw new Error('AI response generation failed');
      }

      const responseData = await finalResponse.json();
      let parsedResponse;
      try {
        let cleanedText = responseData.choices[0]?.message?.content.trim();
        if (cleanedText.startsWith('```')) {
          cleanedText = cleanedText.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
        }
        parsedResponse = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error('Failed to parse AI response');
        // Safe fallback - no data leakage
        return res.json({
          success: true,
          response: 'I apologize, but I had trouble processing that request. Please try rephrasing or ask in a different way.',
          actionType: "query",
          dataChanged: false
        });
      }

      // SECURITY: Validate response doesn't echo sensitive contextData
      const responseText = JSON.stringify(parsedResponse.response || '');
      if (contextData && contextData.length > 100) {
        // Check if response contains large chunks of raw contextData (potential echo attack)
        const contextSample = contextData.substring(0, 200);
        if (responseText.includes(contextSample)) {
          console.warn('[AI Control] SECURITY: Detected potential data echo in response');
          return res.json({
            success: true,
            response: 'I found the information you requested. How would you like me to help you with it?',
            actionType: "query",
            dataChanged: false
          });
        }
      }

      console.log('[Data Query] Response generated and validated');

      res.json({
        success: true,
        response: parsedResponse.response,
        intent: parsedResponse.intent,
        foundLocation: parsedResponse.foundLocation,
        position: parsedResponse.position,
        dataChanged: false,
        requiresConfirmation: false
      });

    } catch (error: any) {
      console.error('Error in data query:', error);
      res.status(500).json({ 
        success: false,
        response: `Sorry, I encountered an error: ${error.message}. Please try rephrasing your request.`,
        message: error.message || 'Failed to process query' 
      });
    }
  });

  // ===== NEW GENERAL INFORMATION ROUTES =====

  // Get all general info data (for main dashboard)
  app.get("/api/admin/general-info-all", async (req: Request, res: Response) => {
    try {
      const { data: settings, error } = await supabase
        .from('college_settings')
        .select('*');

      if (error) throw error;

      // Organize data by categories
      const result: any = {
        basicDetails: {},
        aboutHistory: {},
        administrationManagement: {},
        admissionEligibility: {},
        scholarshipsFinancialAid: {},
        facilitiesInfrastructure: {},
        technicalDigitalResources: {},
        studentSupportServices: {},
        achievementsRecognitions: {},
        campusEnvironment: {},
        rulesRegulations: {},
        miscellaneous: {},
        additionalInfo: {},
        historyOverview: {}, // Legacy support
        facilities: [],
        admissionScholarship: {},
        socialMedia: {},
        newsAnnouncements: {},
        quickStats: {},
      };

      settings?.forEach((setting: any) => {
        if (setting.key.startsWith('general_info_')) {
          const category = setting.key.replace('general_info_', '');
          
          if (category === 'basic_details') {
            result.basicDetails = setting.value;
          } else if (category === 'about_history_overview') {
            result.aboutHistory = setting.value;
          } else if (category === 'administration_management') {
            result.administrationManagement = setting.value;
          } else if (category === 'admission_eligibility') {
            result.admissionEligibility = setting.value;
          } else if (category === 'scholarships_financial_aid') {
            result.scholarshipsFinancialAid = setting.value;
          } else if (category === 'facilities_infrastructure') {
            result.facilitiesInfrastructure = setting.value;
          } else if (category === 'technical_digital_resources') {
            result.technicalDigitalResources = setting.value;
          } else if (category === 'student_support_services') {
            result.studentSupportServices = setting.value;
          } else if (category === 'achievements_recognitions') {
            result.achievementsRecognitions = setting.value;
          } else if (category === 'campus_environment') {
            result.campusEnvironment = setting.value;
          } else if (category === 'rules_regulations') {
            result.rulesRegulations = setting.value;
          } else if (category === 'miscellaneous') {
            result.miscellaneous = setting.value;
          } else if (category === 'additional_info') {
            result.additionalInfo = setting.value;
          } else if (category === 'history_overview') {
            result.historyOverview = setting.value;
          } else if (category === 'facilities') {
            result.facilities = setting.value.facilities || [];
          } else if (category === 'admission_scholarship') {
            result.admissionScholarship = setting.value;
          } else if (category === 'social_media') {
            result.socialMedia = setting.value;
          } else if (category === 'news_highlights') {
            result.newsAnnouncements = setting.value;
          } else if (category === 'quick_stats') {
            result.quickStats = setting.value;
          }
        }
      });

      res.json(result);
    } catch (error: any) {
      console.error('Error fetching general info:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Basic Details Routes
  app.get("/api/admin/general-info/basic-details", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('college_settings')
        .select('*')
        .eq('key', 'general_info_basic_details')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      // Parse JSON value if it exists
      const parsedValue = data?.value ? (typeof data.value === 'string' ? JSON.parse(data.value) : data.value) : {};
      res.json(parsedValue);
    } catch (error: any) {
      console.error('Error fetching basic details:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/general-info/basic-details", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('college_settings')
        .upsert({
          key: 'general_info_basic_details',
          value: JSON.stringify(req.body),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key'
        })
        .select()
        .single();

      if (error) throw error;
      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Error saving basic details:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // About / History / Overview Routes (New Section)
  app.get("/api/admin/general-info/about-history-overview", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('college_settings')
        .select('*')
        .eq('key', 'general_info_about_history_overview')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      const parsedValue = data?.value ? (typeof data.value === 'string' ? JSON.parse(data.value) : data.value) : {};
      res.json(parsedValue);
    } catch (error: any) {
      console.error('Error fetching about/history/overview:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/general-info/about-history-overview", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('college_settings')
        .upsert({
          key: 'general_info_about_history_overview',
          value: JSON.stringify(req.body),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key'
        })
        .select()
        .single();

      if (error) throw error;
      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Error saving about/history/overview:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Administration / Management Routes
  app.get("/api/admin/general-info/administration-management", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('college_settings')
        .select('*')
        .eq('key', 'general_info_administration_management')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      const parsedValue = data?.value ? (typeof data.value === 'string' ? JSON.parse(data.value) : data.value) : {};
      res.json(parsedValue);
    } catch (error: any) {
      console.error('Error fetching administration/management:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/general-info/administration-management", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('college_settings')
        .upsert({
          key: 'general_info_administration_management',
          value: JSON.stringify(req.body),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key'
        })
        .select()
        .single();

      if (error) throw error;
      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Error saving administration/management:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Admission & Eligibility Routes
  app.get("/api/admin/general-info/admission-eligibility", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('college_settings')
        .select('*')
        .eq('key', 'general_info_admission_eligibility')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      const parsedValue = data?.value ? (typeof data.value === 'string' ? JSON.parse(data.value) : data.value) : {};
      res.json(parsedValue);
    } catch (error: any) {
      console.error('Error fetching admission/eligibility:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/general-info/admission-eligibility", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('college_settings')
        .upsert({
          key: 'general_info_admission_eligibility',
          value: JSON.stringify(req.body),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key'
        })
        .select()
        .single();

      if (error) throw error;
      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Error saving admission/eligibility:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Scholarships & Financial Aid Routes
  app.get("/api/admin/general-info/scholarships-financial-aid", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('college_settings')
        .select('*')
        .eq('key', 'general_info_scholarships_financial_aid')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      const parsedValue = data?.value ? (typeof data.value === 'string' ? JSON.parse(data.value) : data.value) : {};
      res.json(parsedValue);
    } catch (error: any) {
      console.error('Error fetching scholarships/financial aid:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/general-info/scholarships-financial-aid", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('college_settings')
        .upsert({
          key: 'general_info_scholarships_financial_aid',
          value: JSON.stringify(req.body),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key'
        })
        .select()
        .single();

      if (error) throw error;
      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Error saving scholarships/financial aid:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Facilities & Infrastructure Routes
  app.get("/api/admin/general-info/facilities-infrastructure", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('college_settings')
        .select('*')
        .eq('key', 'general_info_facilities_infrastructure')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      const parsedValue = data?.value ? (typeof data.value === 'string' ? JSON.parse(data.value) : data.value) : {};
      res.json(parsedValue);
    } catch (error: any) {
      console.error('Error fetching facilities/infrastructure:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/general-info/facilities-infrastructure", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('college_settings')
        .upsert({
          key: 'general_info_facilities_infrastructure',
          value: JSON.stringify(req.body),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key'
        })
        .select()
        .single();

      if (error) throw error;
      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Error saving facilities/infrastructure:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Technical & Digital Resources Routes
  app.get("/api/admin/general-info/technical-digital-resources", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('college_settings')
        .select('*')
        .eq('key', 'general_info_technical_digital_resources')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      const parsedValue = data?.value ? (typeof data.value === 'string' ? JSON.parse(data.value) : data.value) : {};
      res.json(parsedValue);
    } catch (error: any) {
      console.error('Error fetching technical/digital resources:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/general-info/technical-digital-resources", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('college_settings')
        .upsert({
          key: 'general_info_technical_digital_resources',
          value: JSON.stringify(req.body),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key'
        })
        .select()
        .single();

      if (error) throw error;
      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Error saving technical/digital resources:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Student Support & Services Routes
  app.get("/api/admin/general-info/student-support-services", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('college_settings')
        .select('*')
        .eq('key', 'general_info_student_support_services')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      const parsedValue = data?.value ? (typeof data.value === 'string' ? JSON.parse(data.value) : data.value) : {};
      res.json(parsedValue);
    } catch (error: any) {
      console.error('Error fetching student support services:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/general-info/student-support-services", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('college_settings')
        .upsert({
          key: 'general_info_student_support_services',
          value: JSON.stringify(req.body),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key'
        })
        .select()
        .single();

      if (error) throw error;
      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Error saving student support services:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Achievements & Recognitions Routes
  app.get("/api/admin/general-info/achievements-recognitions", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('college_settings')
        .select('*')
        .eq('key', 'general_info_achievements_recognitions')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      const parsedValue = data?.value ? (typeof data.value === 'string' ? JSON.parse(data.value) : data.value) : {};
      res.json(parsedValue);
    } catch (error: any) {
      console.error('Error fetching achievements & recognitions:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/general-info/achievements-recognitions", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('college_settings')
        .upsert({
          key: 'general_info_achievements_recognitions',
          value: JSON.stringify(req.body),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key'
        })
        .select()
        .single();

      if (error) throw error;
      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Error saving achievements & recognitions:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // History & Overview Routes
  app.get("/api/admin/general-info/history-overview", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('college_settings')
        .select('*')
        .eq('key', 'general_info_history_overview')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      res.json(data?.value || {});
    } catch (error: any) {
      console.error('Error fetching history:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/general-info/history-overview", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('college_settings')
        .upsert({
          key: 'general_info_history_overview',
          value: req.body,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Error saving history:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Facilities Routes
  app.get("/api/admin/general-info/facilities", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('college_settings')
        .select('*')
        .eq('key', 'general_info_facilities')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      res.json(data?.value || { facilities: [] });
    } catch (error: any) {
      console.error('Error fetching facilities:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/general-info/facilities", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('college_settings')
        .upsert({
          key: 'general_info_facilities',
          value: req.body,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Error saving facilities:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Admission & Scholarship Routes
  app.get("/api/admin/general-info/admission-scholarship", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('college_settings')
        .select('*')
        .eq('key', 'general_info_admission_scholarship')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      res.json(data?.value || {});
    } catch (error: any) {
      console.error('Error fetching admission info:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/general-info/admission-scholarship", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('college_settings')
        .upsert({
          key: 'general_info_admission_scholarship',
          value: req.body,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Error saving admission info:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Social Media Routes
  app.get("/api/admin/general-info/social-media", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('college_settings')
        .select('*')
        .eq('key', 'general_info_social_media')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      res.json(data?.value || {});
    } catch (error: any) {
      console.error('Error fetching social media:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/general-info/social-media", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('college_settings')
        .upsert({
          key: 'general_info_social_media',
          value: req.body,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Error saving social media:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // News & Announcements Routes
  app.get("/api/admin/general-info/news-announcements", async (req: Request, res: Response) => {
    try {
      // Fetch active notices/events from head-admin tables
      const { data: notices, error: noticesError } = await supabase
        .from('notices')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (noticesError) throw noticesError;

      // Fetch highlighted news IDs
      const { data: settings, error: settingsError } = await supabase
        .from('college_settings')
        .select('*')
        .eq('key', 'general_info_news_highlights')
        .single();

      if (settingsError && settingsError.code !== 'PGRST116') throw settingsError;

      res.json({
        news: notices || [],
        highlighted: settings?.value?.highlighted || [],
        updated_at: settings?.updated_at || new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Error fetching news:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/general-info/news-announcements/highlight", async (req: Request, res: Response) => {
    try {
      const { highlighted } = req.body;

      const { data, error } = await supabase
        .from('college_settings')
        .upsert({
          key: 'general_info_news_highlights',
          value: { highlighted },
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Error saving news highlights:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Quick Stats Routes
  app.get("/api/admin/general-info/quick-stats", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('college_settings')
        .select('*')
        .eq('key', 'general_info_quick_stats')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      res.json(data?.value || {});
    } catch (error: any) {
      console.error('Error fetching quick stats:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/general-info/quick-stats", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('college_settings')
        .upsert({
          key: 'general_info_quick_stats',
          value: req.body,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Error saving quick stats:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Additional Info Routes
  app.get("/api/admin/general-info/additional-info", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('college_settings')
        .select('*')
        .eq('key', 'general_info_additional_info')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      // Parse JSON value if it exists
      const parsedValue = data?.value ? JSON.parse(data.value) : { entries: [] };
      res.json(parsedValue);
    } catch (error: any) {
      console.error('Error fetching additional info:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/general-info/additional-info", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('college_settings')
        .upsert({
          key: 'general_info_additional_info',
          value: JSON.stringify(req.body),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key'
        })
        .select()
        .single();

      if (error) throw error;
      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Error saving additional info:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Campus & Environment Routes
  app.get("/api/admin/general-info/campus-environment", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('college_settings')
        .select('*')
        .eq('key', 'general_info_campus_environment')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      const parsedValue = data?.value ? (typeof data.value === 'string' ? JSON.parse(data.value) : data.value) : {};
      res.json(parsedValue);
    } catch (error: any) {
      console.error('Error fetching campus environment:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/general-info/campus-environment", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('college_settings')
        .upsert({
          key: 'general_info_campus_environment',
          value: JSON.stringify(req.body),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key'
        })
        .select()
        .single();

      if (error) throw error;
      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Error saving campus environment:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Rules & Regulations Routes
  app.get("/api/admin/general-info/rules-regulations", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('college_settings')
        .select('*')
        .eq('key', 'general_info_rules_regulations')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      const parsedValue = data?.value ? (typeof data.value === 'string' ? JSON.parse(data.value) : data.value) : {};
      res.json(parsedValue);
    } catch (error: any) {
      console.error('Error fetching rules regulations:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/general-info/rules-regulations", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('college_settings')
        .upsert({
          key: 'general_info_rules_regulations',
          value: JSON.stringify(req.body),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key'
        })
        .select()
        .single();

      if (error) throw error;
      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Error saving rules regulations:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Miscellaneous Information Routes
  app.get("/api/admin/general-info/miscellaneous", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('college_settings')
        .select('*')
        .eq('key', 'general_info_miscellaneous')
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      const parsedValue = data?.value ? (typeof data.value === 'string' ? JSON.parse(data.value) : data.value) : {};
      res.json(parsedValue);
    } catch (error: any) {
      console.error('Error fetching miscellaneous info:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/admin/general-info/miscellaneous", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('college_settings')
        .upsert({
          key: 'general_info_miscellaneous',
          value: JSON.stringify(req.body),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key'
        })
        .select()
        .single();

      if (error) throw error;
      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Error saving miscellaneous info:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // AI Generate endpoint for Additional Info
  app.post("/api/ai-generate", async (req: Request, res: Response) => {
    try {
      const { prompt, type } = req.body;

      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      // Get API key from environment
      const groqApiKey = process.env.GROQ_API_KEY;
      if (!groqApiKey) {
        return res.status(500).json({ 
          message: "Groq API key not configured. Please contact administrator." 
        });
      }

      // Construct system prompt based on type
      let systemPrompt = "";
      if (type === "additional_info") {
        systemPrompt = `You are an AI assistant helping to generate structured information for a college admin panel.
Generate one or more information entries based on the user's description.
Each entry should have: title, content, and optionally a category.

IMPORTANT: Return ONLY valid JSON in this exact format (no markdown, no extra text):
For single entry: {"title": "...", "content": "...", "category": "..."}
For multiple entries: {"entries": [{"title": "...", "content": "...", "category": "..."}, ...]}

Keep content detailed and professional.`;
      }

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${groqApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt }
          ],
          model: "llama-3.3-70b-versatile",
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "AI generation failed");
      }

      const result = await response.json();
      const generatedText = result.choices[0]?.message?.content;

      if (!generatedText) {
        throw new Error("No content generated");
      }

      // Parse the JSON response
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("Failed to parse AI response");
      }

      const parsedData = JSON.parse(jsonMatch[0]);
      res.json(parsedData);
    } catch (error: any) {
      console.error('Error in AI generation:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // ===== SYLLABUS MANAGER ROUTES =====

  // Get all syllabus courses (with optional semester filter)
  app.get("/api/admin/syllabus/courses", async (req: Request, res: Response) => {
    try {
      const { semester } = req.query;
      let query = supabase.from('syllabus_courses').select('*').order('semester').order('course_code');
      if (semester && semester !== 'all') {
        query = query.eq('semester', semester);
      }
      const { data, error } = await query;
      if (error) {
        if (error.code === '42P01') return res.json({ courses: [] });
        throw error;
      }
      res.json({ courses: data || [] });
    } catch (error: any) {
      console.error('Error fetching syllabus courses:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get single course with its content
  app.get("/api/admin/syllabus/courses/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { data: course, error: courseError } = await supabase
        .from('syllabus_courses').select('*').eq('id', id).single();
      if (courseError) throw courseError;

      const { data: content, error: contentError } = await supabase
        .from('course_content').select('*').eq('course_code', course.course_code)
        .order('section_type').order('unit_number');
      if (contentError && contentError.code !== '42P01') throw contentError;

      res.json({ course, content: content || [] });
    } catch (error: any) {
      console.error('Error fetching syllabus course:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Create syllabus course
  app.post("/api/admin/syllabus/courses", async (req: Request, res: Response) => {
    try {
      const { semester, course_code, course_name, course_type, theory_credits, practical_credits, total_credits, contact_hours, max_marks } = req.body;
      const { data, error } = await supabase.from('syllabus_courses').insert({
        semester, course_code, course_name, course_type,
        theory_credits: parseInt(theory_credits) || 0,
        practical_credits: parseInt(practical_credits) || 0,
        total_credits: parseInt(total_credits) || 0,
        contact_hours: parseInt(contact_hours) || 0,
        max_marks: parseInt(max_marks) || 100,
      }).select().single();
      if (error) throw error;
      res.json({ course: data });
    } catch (error: any) {
      console.error('Error creating syllabus course:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Update syllabus course
  app.put("/api/admin/syllabus/courses/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { semester, course_code, course_name, course_type, theory_credits, practical_credits, total_credits, contact_hours, max_marks } = req.body;
      const { data, error } = await supabase.from('syllabus_courses').update({
        semester, course_code, course_name, course_type,
        theory_credits: parseInt(theory_credits) || 0,
        practical_credits: parseInt(practical_credits) || 0,
        total_credits: parseInt(total_credits) || 0,
        contact_hours: parseInt(contact_hours) || 0,
        max_marks: parseInt(max_marks) || 100,
      }).eq('id', id).select().single();
      if (error) throw error;
      res.json({ course: data });
    } catch (error: any) {
      console.error('Error updating syllabus course:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Delete syllabus course (also deletes its content)
  app.delete("/api/admin/syllabus/courses/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { data: course } = await supabase.from('syllabus_courses').select('course_code').eq('id', id).single();
      if (course) {
        await supabase.from('course_content').delete().eq('course_code', course.course_code);
      }
      const { error } = await supabase.from('syllabus_courses').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting syllabus course:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get course content by course_code
  app.get("/api/admin/syllabus/content/:courseCode", async (req: Request, res: Response) => {
    try {
      const { courseCode } = req.params;
      const { data, error } = await supabase.from('course_content').select('*')
        .eq('course_code', courseCode).order('section_type').order('unit_number');
      if (error) {
        if (error.code === '42P01') return res.json({ content: [] });
        throw error;
      }
      res.json({ content: data || [] });
    } catch (error: any) {
      console.error('Error fetching course content:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Add course content unit
  app.post("/api/admin/syllabus/content", async (req: Request, res: Response) => {
    try {
      const { course_code, section_type, unit_number, unit_title, topics, marks, contact_hours } = req.body;
      const { data, error } = await supabase.from('course_content').insert({
        course_code, section_type, unit_number, unit_title, topics,
        marks: marks ? parseInt(marks) : null,
        contact_hours: contact_hours ? parseInt(contact_hours) : null,
      }).select().single();
      if (error) throw error;
      res.json({ content: data });
    } catch (error: any) {
      console.error('Error creating course content:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Update course content unit
  app.put("/api/admin/syllabus/content/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { unit_number, unit_title, topics, marks, contact_hours } = req.body;
      const { data, error } = await supabase.from('course_content').update({
        unit_number, unit_title, topics,
        marks: marks ? parseInt(marks) : null,
        contact_hours: contact_hours ? parseInt(contact_hours) : null,
      }).eq('id', id).select().single();
      if (error) throw error;
      res.json({ content: data });
    } catch (error: any) {
      console.error('Error updating course content:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Delete course content unit
  app.delete("/api/admin/syllabus/content/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { error } = await supabase.from('course_content').delete().eq('id', id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting course content:', error);
      res.status(500).json({ message: error.message });
    }
  });
}
