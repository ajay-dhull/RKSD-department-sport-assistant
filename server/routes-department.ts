import type { Express } from "express";
import { supabase } from "./supabase";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { generateDepartmentToken, requireDepartmentAuth, validateDepartmentAccess } from "./department-auth";
import { callGroqWithFallback } from "./groq-multi-key";

const loginSchema = z.object({
  department_id: z.string(),
  password: z.string(),
});

const addDataSchema = z.object({
  data_type: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
  metadata: z.any().optional(),
});

const updateDataSchema = z.object({
  title: z.string().optional(),
  content: z.string().optional(),
  metadata: z.any().optional(),
});

const facultySchema = z.object({
  name: z.string().min(1),
  designation: z.string().min(1),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
  experience: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  photo_url: z.string().optional(),
  subjects: z.array(z.string()).optional(),
  order_index: z.number().optional(),
});

const courseSchema = z.object({
  name: z.string().min(1),
  code: z.string().optional(),
  duration: z.string().optional(),
  eligibility: z.string().optional(),
  intake: z.number().optional(),
  syllabus_url: z.string().optional(),
  description: z.string().optional(),
});

const noticeSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  expiry_date: z.string().optional(),
  attachment_url: z.string().optional(),
});

const gallerySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  image_url: z.string().min(1),
  event_date: z.string().optional(),
  category: z.string().optional(),
});

const labSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  equipment: z.array(z.string()).optional(),
  capacity: z.number().optional(),
  in_charge: z.string().optional(),
  photo_url: z.string().optional(),
});

const deptInfoSchema = z.object({
  about: z.string().optional(),
  vision: z.string().optional(),
  mission: z.string().optional(),
  office_location: z.string().optional(),
  contact_email: z.string().optional(),
  contact_phone: z.string().optional(),
  banner_url: z.string().optional(),
});

export function registerDepartmentRoutes(app: Express) {
  
  // Department login
  app.post("/api/department/login", async (req, res) => {
    try {
      const { department_id, password } = loginSchema.parse(req.body);

      const { data: department, error } = await supabase
        .from('departments')
        .select('*')
        .eq('department_id', department_id)
        .eq('is_active', true)
        .single();

      if (error || !department) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, department.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const { password: _, ...departmentData } = department;

      const token = generateDepartmentToken(department.id, department.slug);

      res.json({
        department: departmentData,
        token
      });
    } catch (error: any) {
      console.error('Department login error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get department info by slug (public)
  app.get("/api/department/:slug", async (req, res) => {
    try {
      const { slug } = req.params;

      const { data, error } = await supabase
        .from('departments')
        .select('id, name, slug, department_id, head_name, contact_email, contact_phone, description, is_active')
        .eq('slug', slug)
        .single();

      if (error) throw error;
      res.json({ department: data });
    } catch (error: any) {
      console.error('Error fetching department:', error);
      res.status(404).json({ message: "Department not found" });
    }
  });

  // ============================================================================
  // DEPARTMENT DATA - Generic CRUD (protected)
  // ============================================================================

  // Get all department data
  app.get("/api/department/:departmentId/data", requireDepartmentAuth, validateDepartmentAccess, async (req, res) => {
    try {
      const { departmentId } = req.params;
      const { type } = req.query;

      let query = supabase
        .from('department_data')
        .select('*')
        .eq('department_id', departmentId);
      
      if (type) {
        query = query.eq('data_type', type);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      res.json({ data });
    } catch (error: any) {
      console.error('Error fetching department data:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get department data by type (public - for AI assistant)
  app.get("/api/public/department/:departmentId/data", async (req, res) => {
    try {
      const { departmentId } = req.params;
      const { type } = req.query;

      let query = supabase
        .from('department_data')
        .select('*')
        .eq('department_id', departmentId);
      
      if (type) {
        query = query.eq('data_type', type);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) throw error;
      res.json({ data });
    } catch (error: any) {
      console.error('Error fetching public department data:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get all departments data (public - for AI assistant)
  app.get("/api/public/all-departments-data", async (req, res) => {
    try {
      const { data: departments, error: deptError } = await supabase
        .from('departments')
        .select('id, name, slug, head_name, contact_email, contact_phone, description')
        .eq('is_active', true);

      if (deptError) throw deptError;

      const departmentIds = departments?.map(d => d.id) || [];

      const { data: allData, error: dataError } = await supabase
        .from('department_data')
        .select('*')
        .in('department_id', departmentIds)
        .order('created_at', { ascending: false });

      if (dataError) throw dataError;

      const result = departments?.map(dept => ({
        ...dept,
        data: allData?.filter(d => d.department_id === dept.id) || []
      }));

      res.json({ departments: result });
    } catch (error: any) {
      console.error('Error fetching all departments data:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Add department data (protected)
  app.post("/api/department/:departmentId/data", requireDepartmentAuth, validateDepartmentAccess, async (req, res) => {
    try {
      const { departmentId } = req.params;
      const validated = addDataSchema.parse(req.body);

      const { data, error } = await supabase
        .from('department_data')
        .insert({
          department_id: departmentId,
          ...validated,
          metadata: validated.metadata ? JSON.stringify(validated.metadata) : null
        })
        .select()
        .single();

      if (error) throw error;
      res.json({ data });
    } catch (error: any) {
      console.error('Error adding department data:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Update department data (protected)
  app.put("/api/department/data/:id", requireDepartmentAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const validated = updateDataSchema.parse(req.body);
      const departmentAuth = (req as any).departmentAuth;

      const { data, error } = await supabase
        .from('department_data')
        .update({
          ...validated,
          metadata: validated.metadata ? JSON.stringify(validated.metadata) : undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('department_id', departmentAuth.departmentId)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({ message: "Data not found or access denied" });
        }
        throw error;
      }

      res.json({ data });
    } catch (error: any) {
      console.error('Error updating department data:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Delete department data (protected)
  app.delete("/api/department/data/:id", requireDepartmentAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const departmentAuth = (req as any).departmentAuth;

      const { error, count } = await supabase
        .from('department_data')
        .delete({ count: 'exact' })
        .eq('id', id)
        .eq('department_id', departmentAuth.departmentId);

      if (error) throw error;
      
      if (count === 0) {
        return res.status(404).json({ message: "Data not found or access denied" });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting department data:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // DEPARTMENT INFO - Update basic info (protected)
  // ============================================================================

  app.put("/api/department/:departmentId/info", requireDepartmentAuth, validateDepartmentAccess, async (req, res) => {
    try {
      const { departmentId } = req.params;
      const validated = deptInfoSchema.parse(req.body);

      const { data, error } = await supabase
        .from('departments')
        .update({
          description: validated.about,
          contact_email: validated.contact_email,
          contact_phone: validated.contact_phone,
          updated_at: new Date().toISOString()
        })
        .eq('id', departmentId)
        .select()
        .single();

      if (error) throw error;

      const infoFields = ['vision', 'mission', 'office_location', 'banner_url'];
      for (const field of infoFields) {
        if (validated[field as keyof typeof validated]) {
          await supabase
            .from('department_data')
            .upsert({
              department_id: departmentId,
              data_type: 'info',
              title: field,
              content: validated[field as keyof typeof validated] as string
            }, { onConflict: 'department_id,data_type,title' });
        }
      }

      res.json({ department: data });
    } catch (error: any) {
      console.error('Error updating department info:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // FACULTY MANAGEMENT (protected)
  // ============================================================================

  app.post("/api/department/:departmentId/faculty", requireDepartmentAuth, validateDepartmentAccess, async (req, res) => {
    try {
      const { departmentId } = req.params;
      const validated = facultySchema.parse(req.body);

      const { data, error } = await supabase
        .from('department_data')
        .insert({
          department_id: departmentId,
          data_type: 'faculty',
          title: validated.name,
          content: validated.designation,
          metadata: JSON.stringify({
            qualification: validated.qualification,
            specialization: validated.specialization,
            experience: validated.experience,
            email: validated.email,
            phone: validated.phone,
            photo_url: validated.photo_url,
            subjects: validated.subjects,
            order_index: validated.order_index
          })
        })
        .select()
        .single();

      if (error) throw error;
      res.json({ faculty: data });
    } catch (error: any) {
      console.error('Error adding faculty:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // COURSES MANAGEMENT (protected)
  // ============================================================================

  app.post("/api/department/:departmentId/courses", requireDepartmentAuth, validateDepartmentAccess, async (req, res) => {
    try {
      const { departmentId } = req.params;
      const validated = courseSchema.parse(req.body);

      const { data, error } = await supabase
        .from('department_data')
        .insert({
          department_id: departmentId,
          data_type: 'course',
          title: validated.name,
          content: validated.description || '',
          metadata: JSON.stringify({
            code: validated.code,
            duration: validated.duration,
            eligibility: validated.eligibility,
            intake: validated.intake,
            syllabus_url: validated.syllabus_url
          })
        })
        .select()
        .single();

      if (error) throw error;
      res.json({ course: data });
    } catch (error: any) {
      console.error('Error adding course:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // NOTICES MANAGEMENT (protected)
  // ============================================================================

  app.post("/api/department/:departmentId/notices", requireDepartmentAuth, validateDepartmentAccess, async (req, res) => {
    try {
      const { departmentId } = req.params;
      const validated = noticeSchema.parse(req.body);

      const { data, error } = await supabase
        .from('department_data')
        .insert({
          department_id: departmentId,
          data_type: 'notice',
          title: validated.title,
          content: validated.content,
          metadata: JSON.stringify({
            priority: validated.priority || 'medium',
            expiry_date: validated.expiry_date,
            attachment_url: validated.attachment_url
          })
        })
        .select()
        .single();

      if (error) throw error;
      res.json({ notice: data });
    } catch (error: any) {
      console.error('Error adding notice:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // GALLERY MANAGEMENT (protected)
  // ============================================================================

  app.post("/api/department/:departmentId/gallery", requireDepartmentAuth, validateDepartmentAccess, async (req, res) => {
    try {
      const { departmentId } = req.params;
      const validated = gallerySchema.parse(req.body);

      const { data, error } = await supabase
        .from('department_data')
        .insert({
          department_id: departmentId,
          data_type: 'gallery',
          title: validated.title,
          content: validated.description || '',
          metadata: JSON.stringify({
            image_url: validated.image_url,
            event_date: validated.event_date,
            category: validated.category
          })
        })
        .select()
        .single();

      if (error) throw error;
      res.json({ gallery: data });
    } catch (error: any) {
      console.error('Error adding gallery item:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // LABS & FACILITIES MANAGEMENT (protected)
  // ============================================================================

  app.post("/api/department/:departmentId/labs", requireDepartmentAuth, validateDepartmentAccess, async (req, res) => {
    try {
      const { departmentId } = req.params;
      const validated = labSchema.parse(req.body);

      const { data, error } = await supabase
        .from('department_data')
        .insert({
          department_id: departmentId,
          data_type: 'lab',
          title: validated.name,
          content: validated.description || '',
          metadata: JSON.stringify({
            equipment: validated.equipment,
            capacity: validated.capacity,
            in_charge: validated.in_charge,
            photo_url: validated.photo_url
          })
        })
        .select()
        .single();

      if (error) throw error;
      res.json({ lab: data });
    } catch (error: any) {
      console.error('Error adding lab:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // CLASS SCHEDULES MANAGEMENT (protected)
  // ============================================================================

  const classScheduleSchema = z.object({
    course_name: z.string().min(1),
    course_id: z.string().optional(),
    shift: z.string().min(1),
    year: z.number().min(1).max(10),
    section: z.string().min(1),
    day_of_week: z.string().min(1),
    start_time: z.string().min(1),
    end_time: z.string().min(1),
    room_number: z.string().optional(),
    teacher_id: z.string().optional(),
    teacher_name: z.string().optional(),
    subject: z.string().optional(),
  });

  // Get class schedules for department
  app.get("/api/department/:departmentId/class-schedules", requireDepartmentAuth, validateDepartmentAccess, async (req, res) => {
    try {
      const { departmentId } = req.params;
      const { course_id, shift, year, section } = req.query;

      let query = supabase
        .from('class_schedules')
        .select('*')
        .eq('department_id', departmentId)
        .eq('is_active', true);

      if (course_id) query = query.eq('course_id', course_id);
      if (shift) query = query.eq('shift', shift);
      if (year) query = query.eq('year', parseInt(year as string));
      if (section) query = query.eq('section', section);

      const { data, error } = await query.order('day_of_week').order('start_time');

      if (error) {
        if (error.code === '42P01') return res.json({ schedules: [] });
        throw error;
      }
      res.json({ schedules: data });
    } catch (error: any) {
      console.error('Error fetching class schedules:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Add class schedule
  app.post("/api/department/:departmentId/class-schedules", requireDepartmentAuth, validateDepartmentAccess, async (req, res) => {
    try {
      const { departmentId } = req.params;

      let validated: any;
      try {
        validated = classScheduleSchema.parse(req.body);
      } catch (zodErr: any) {
        return res.status(400).json({ message: 'Validation error: ' + (zodErr.errors?.[0]?.message || zodErr.message) });
      }

      const { data, error } = await supabase
        .from('class_schedules')
        .insert({ department_id: departmentId, ...validated })
        .select()
        .single();

      if (error) {
        if (error.code === '42P01') return res.status(503).json({ message: 'Table not ready. Please run setup.sql in Supabase.' });
        console.error('Supabase insert error:', error);
        return res.status(500).json({ message: error.message });
      }
      res.json({ schedule: data });
    } catch (error: any) {
      console.error('Error adding class schedule:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Update class schedule
  app.put("/api/department/class-schedules/:id", requireDepartmentAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const departmentAuth = (req as any).departmentAuth;
      const updateData = req.body;

      const { data, error } = await supabase
        .from('class_schedules')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('department_id', departmentAuth.departmentId)
        .select()
        .single();

      if (error) throw error;
      res.json({ schedule: data });
    } catch (error: any) {
      console.error('Error updating class schedule:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Delete class schedule
  app.delete("/api/department/class-schedules/:id", requireDepartmentAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const departmentAuth = (req as any).departmentAuth;

      const { error } = await supabase
        .from('class_schedules')
        .delete()
        .eq('id', id)
        .eq('department_id', departmentAuth.departmentId);

      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting class schedule:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // DEPARTMENT STAFF/FACULTY (linked from staff_members)
  // ============================================================================

  // Get staff members for department
  app.get("/api/department/:departmentId/staff", requireDepartmentAuth, validateDepartmentAccess, async (req, res) => {
    try {
      const { departmentId } = req.params;

      const { data, error } = await supabase
        .from('staff_members')
        .select('*')
        .eq('department_id', departmentId)
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      res.json({ staff: data });
    } catch (error: any) {
      console.error('Error fetching department staff:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Add staff member to department
  app.post("/api/department/:departmentId/staff", requireDepartmentAuth, validateDepartmentAccess, async (req, res) => {
    try {
      const { departmentId } = req.params;
      const { full_name, employee_id, role, designation, email, phone, qualification, specialization } = req.body;

      const { data, error } = await supabase
        .from('staff_members')
        .insert({
          full_name,
          employee_id,
          department_id: departmentId,
          role: role || 'Faculty',
          designation,
          email,
          phone,
          qualification,
          specialization,
        })
        .select()
        .single();

      if (error) throw error;
      res.json({ staff: data });
    } catch (error: any) {
      console.error('Error adding staff member:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Update staff member
  app.put("/api/department/staff/:id", requireDepartmentAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const departmentAuth = (req as any).departmentAuth;
      const updateData = req.body;

      const { data, error } = await supabase
        .from('staff_members')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('department_id', departmentAuth.departmentId)
        .select()
        .single();

      if (error) throw error;
      res.json({ staff: data });
    } catch (error: any) {
      console.error('Error updating staff member:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // DEPARTMENT COURSES (linked from courses table)
  // ============================================================================

  // Get courses for department from courses table
  app.get("/api/department/:departmentId/courses-list", requireDepartmentAuth, validateDepartmentAccess, async (req, res) => {
    try {
      const { departmentId } = req.params;

      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('department_id', departmentId)
        .eq('is_active', true)
        .order('course_name');

      if (error) throw error;
      res.json({ courses: data });
    } catch (error: any) {
      console.error('Error fetching department courses:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Add course to department
  app.post("/api/department/:departmentId/courses-list", requireDepartmentAuth, validateDepartmentAccess, async (req, res) => {
    try {
      const { departmentId } = req.params;
      const { course_name, course_code, course_type, duration, description, eligibility, total_seats, fees_per_year } = req.body;

      const { data, error } = await supabase
        .from('courses')
        .insert({
          course_name,
          course_code,
          course_type: course_type || 'UG',
          department_id: departmentId,
          duration,
          description,
          eligibility,
          total_seats: total_seats ? parseInt(total_seats) : null,
          fees_per_year: fees_per_year ? parseFloat(fees_per_year) : null,
        })
        .select()
        .single();

      if (error) throw error;
      res.json({ course: data });
    } catch (error: any) {
      console.error('Error adding course:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Update course
  app.put("/api/department/courses-list/:id", requireDepartmentAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const departmentAuth = (req as any).departmentAuth;
      const updateData = req.body;

      const { data, error } = await supabase
        .from('courses')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('department_id', departmentAuth.departmentId)
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
  app.delete("/api/department/courses-list/:id", requireDepartmentAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const departmentAuth = (req as any).departmentAuth;

      const { error } = await supabase
        .from('courses')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('department_id', departmentAuth.departmentId);

      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting course:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // DEPARTMENT INFO UPDATE (extended)
  // ============================================================================

  app.get("/api/department/:departmentId/full-info", requireDepartmentAuth, validateDepartmentAccess, async (req, res) => {
    try {
      const { departmentId } = req.params;

      const { data: dept, error: deptError } = await supabase
        .from('departments')
        .select('*')
        .eq('id', departmentId)
        .single();

      if (deptError) throw deptError;

      const { data: infoData, error: infoError } = await supabase
        .from('department_data')
        .select('*')
        .eq('department_id', departmentId)
        .eq('data_type', 'info');

      if (infoError) throw infoError;

      const infoFields: Record<string, string> = {};
      infoData?.forEach((item: any) => {
        infoFields[item.title] = item.content;
      });

      res.json({
        department: {
          ...dept,
          ...infoFields
        }
      });
    } catch (error: any) {
      console.error('Error fetching department full info:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/department/:departmentId/full-info", requireDepartmentAuth, validateDepartmentAccess, async (req, res) => {
    try {
      const { departmentId } = req.params;
      const { name, head_name, contact_email, contact_phone, description, slogan, location, ...customFields } = req.body;

      // Update main department info
      const { error: deptError } = await supabase
        .from('departments')
        .update({
          name: name || undefined,
          head_name,
          contact_email,
          contact_phone,
          description,
          updated_at: new Date().toISOString()
        })
        .eq('id', departmentId);

      if (deptError) throw deptError;

      // Handle custom fields via department_data
      const customFieldEntries = Object.entries({ slogan, location, ...customFields }).filter(([_, v]) => v !== undefined);
      
      for (const [key, value] of customFieldEntries) {
        const { data: existingData } = await supabase
          .from('department_data')
          .select('id')
          .eq('department_id', departmentId)
          .eq('data_type', 'info')
          .eq('title', key)
          .single();

        if (existingData) {
          await supabase
            .from('department_data')
            .update({ content: value as string, updated_at: new Date().toISOString() })
            .eq('id', existingData.id);
        } else {
          await supabase
            .from('department_data')
            .insert({
              department_id: departmentId,
              data_type: 'info',
              title: key,
              content: value as string
            });
        }
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error('Error updating department info:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // AI GENERATION FOR DEPARTMENT
  // ============================================================================

  app.post("/api/department/:departmentId/ai-generate", requireDepartmentAuth, validateDepartmentAccess, async (req, res) => {
    try {
      const { type, prompt } = req.body;
      
      if (!prompt || !type) {
        return res.status(400).json({ message: "Type and prompt are required" });
      }

      const systemPrompts: Record<string, string> = {
        faculty: `You are an AI assistant that helps create faculty/staff profiles for a college department. Parse the given text and generate structured faculty data. Return a JSON object with an "entries" array containing objects with: full_name, employee_id (generate if not given like EMP-XXX), role, designation, email, phone, qualification, specialization. If multiple faculty members are described, include all of them.`,
        course: `You are an AI assistant that helps create course information for a college. Parse the given text and generate structured course data. Return a JSON object with an "entries" array containing objects with: course_name, course_code, course_type (UG/PG/Diploma), duration, description, eligibility, total_seats, fees_per_year. If multiple courses are described, include all of them.`,
        class_schedule: `You are an AI assistant that helps create class schedules for a college department. Parse the given text and generate structured class schedule data. Return a JSON object with an "entries" array containing objects with: course_name, shift (morning/evening), year (1-6), section (A/B/C etc), day_of_week (Monday-Saturday), start_time (HH:MM format), end_time (HH:MM format), room_number, teacher_name, subject. If multiple class entries are described, include all of them.`,
        other: `You are an AI assistant that helps create department information. Parse the given text and generate structured data. Return a JSON object with an "entries" array containing objects with: title, content, category (optional). If multiple entries are described, include all of them.`
      };

      const systemPrompt = systemPrompts[type] || systemPrompts.other;

      // Use OpenAI if available, else use Groq multi-key fallback
      let generatedContent: any;

      if (process.env.OPENAI_API_KEY) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt }
            ],
            temperature: 0.7,
            response_format: { type: 'json_object' }
          })
        });
        if (!response.ok) throw new Error('AI generation failed');
        const data = await response.json();
        generatedContent = JSON.parse(data.choices[0].message.content);
      } else {
        // Groq multi-key fallback (auto-rotates through GROQ_API_KEY_1, GROQ_API_KEY_2, ...)
        const result = await callGroqWithFallback([
          { role: 'system', content: systemPrompt + ' Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ], { model: 'llama-3.1-8b-instant', max_tokens: 1000, temperature: 0.7 });
        generatedContent = JSON.parse(result.content);
      }

      res.json(generatedContent);
    } catch (error: any) {
      console.error('Error in AI generation:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // DEPARTMENT STATS (protected)
  // ============================================================================

  app.get("/api/department/:departmentId/stats", requireDepartmentAuth, validateDepartmentAccess, async (req, res) => {
    try {
      const { departmentId } = req.params;

      // Get department_data stats
      const { data, error } = await supabase
        .from('department_data')
        .select('data_type')
        .eq('department_id', departmentId);

      if (error) throw error;

      // Get staff count from staff_members table
      const { data: staffData, error: staffError } = await supabase
        .from('staff_members')
        .select('id')
        .eq('department_id', departmentId)
        .eq('is_active', true);

      // Get courses count from courses table
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id')
        .eq('department_id', departmentId)
        .eq('is_active', true);

      // Get class schedules count
      const { data: schedulesData, error: schedulesError } = await supabase
        .from('class_schedules')
        .select('id')
        .eq('department_id', departmentId)
        .eq('is_active', true);

      const stats = {
        faculty: staffData?.length || 0,
        courses: coursesData?.length || 0,
        classes: schedulesData?.length || 0,
        notices: data?.filter(d => d.data_type === 'notice').length || 0,
        gallery: data?.filter(d => d.data_type === 'gallery').length || 0,
        labs: data?.filter(d => d.data_type === 'lab').length || 0,
        other: data?.filter(d => !['faculty', 'course', 'notice', 'gallery', 'lab', 'info'].includes(d.data_type)).length || 0,
        total: (staffData?.length || 0) + (coursesData?.length || 0) + (schedulesData?.length || 0) + (data?.length || 0)
      };

      res.json({ stats });
    } catch (error: any) {
      console.error('Error fetching department stats:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // DEPARTMENT LOCAL FACULTY (separate from admin staff_members)
  // ============================================================================

  // Get department local faculty (added by department panel only)
  app.get("/api/department/:departmentId/local-faculty", requireDepartmentAuth, validateDepartmentAccess, async (req, res) => {
    try {
      const { departmentId } = req.params;

      const { data, error } = await supabase
        .from('department_local_faculty')
        .select('*')
        .eq('department_id', departmentId)
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      res.json({ faculty: data || [] });
    } catch (error: any) {
      console.error('Error fetching department local faculty:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Add department local faculty
  app.post("/api/department/:departmentId/local-faculty", requireDepartmentAuth, validateDepartmentAccess, async (req, res) => {
    try {
      const { departmentId } = req.params;
      const { full_name, employee_id, role, designation, email, phone, qualification, specialization } = req.body;

      const { data, error } = await supabase
        .from('department_local_faculty')
        .insert({
          department_id: departmentId,
          full_name,
          employee_id,
          role: role || 'Faculty',
          designation,
          email,
          phone,
          qualification,
          specialization,
        })
        .select()
        .single();

      if (error) throw error;
      res.json({ faculty: data });
    } catch (error: any) {
      console.error('Error adding department local faculty:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Update department local faculty
  app.put("/api/department/local-faculty/:id", requireDepartmentAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const departmentAuth = (req as any).departmentAuth;
      const updateData = req.body;

      const { data, error } = await supabase
        .from('department_local_faculty')
        .update({ ...updateData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('department_id', departmentAuth.departmentId)
        .select()
        .single();

      if (error) throw error;
      res.json({ faculty: data });
    } catch (error: any) {
      console.error('Error updating department local faculty:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Delete department local faculty
  app.delete("/api/department/local-faculty/:id", requireDepartmentAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const departmentAuth = (req as any).departmentAuth;

      const { error } = await supabase
        .from('department_local_faculty')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('department_id', departmentAuth.departmentId);

      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      console.error('Error deleting department local faculty:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // PUBLIC ROUTES
  // ============================================================================

  // Get public notices
  app.get("/api/public/notices", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*, departments(name)')
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      res.json({ notices: data });
    } catch (error: any) {
      console.error('Error fetching public notices:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get public events
  app.get("/api/public/events", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*, departments(name)')
        .eq('is_active', true)
        .order('event_date', { ascending: false })
        .limit(30);

      if (error) {
        if (error.code === '42P01') return res.json({ events: [] });
        throw error;
      }
      res.json({ events: data || [] });
    } catch (error: any) {
      console.error('Error fetching public events:', error);
      res.json({ events: [] });
    }
  });

  // Get public department info with all data (for AI assistant)
  app.get("/api/public/department/:slug/full", async (req, res) => {
    try {
      const { slug } = req.params;

      const { data: dept, error: deptError } = await supabase
        .from('departments')
        .select('id, name, slug, head_name, contact_email, contact_phone, description')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();

      if (deptError) throw deptError;

      const { data: deptData, error: dataError } = await supabase
        .from('department_data')
        .select('*')
        .eq('department_id', dept.id)
        .order('created_at', { ascending: false });

      if (dataError) throw dataError;

      const organizedData = {
        ...dept,
        faculty: deptData?.filter(d => d.data_type === 'faculty') || [],
        courses: deptData?.filter(d => d.data_type === 'course') || [],
        notices: deptData?.filter(d => d.data_type === 'notice') || [],
        gallery: deptData?.filter(d => d.data_type === 'gallery') || [],
        labs: deptData?.filter(d => d.data_type === 'lab') || [],
        info: deptData?.filter(d => d.data_type === 'info') || [],
        other: deptData?.filter(d => !['faculty', 'course', 'notice', 'gallery', 'lab', 'info'].includes(d.data_type)) || []
      };

      res.json({ department: organizedData });
    } catch (error: any) {
      console.error('Error fetching full department data:', error);
      res.status(404).json({ message: "Department not found" });
    }
  });
}
