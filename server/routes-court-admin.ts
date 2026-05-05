import type { Express, Request, Response } from "express";
import { supabase } from "./supabase";
import { z } from "zod";
import bcrypt from "bcryptjs";

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

const buildingSchema = z.object({
  name: z.string().min(1),
  building_code: z.string().min(1),
  description: z.string().optional(),
  landmark: z.string().optional(),
  directional_notes: z.string().optional(),
  number_of_floors: z.number().optional(),
  photo_url: z.string().optional(),
});

const roomSchema = z.object({
  room_number: z.string().min(1),
  room_name: z.string().optional(),
  building_id: z.string().uuid(),
  floor: z.number().optional(),
  purpose: z.string().optional(),
  in_charge_staff_id: z.string().uuid().optional().nullable(),
  timing: z.string().optional(),
  status: z.string().optional(),
  photo_url: z.string().optional(),
  notes: z.string().optional(),
});

const staffSchema = z.object({
  full_name: z.string().min(1),
  employee_id: z.string().min(1),
  department_id: z.string().uuid().optional().nullable(),
  designation: z.string().min(1),
  role: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  assigned_building_id: z.string().uuid().optional().nullable(),
  assigned_room_id: z.string().uuid().optional().nullable(),
  photo_url: z.string().optional(),
});

const departmentSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  department_code: z.string().min(1),
  head_name: z.string().optional(),
  head_designation: z.string().optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().optional(),
  description: z.string().optional(),
});

const faqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  category: z.string().min(1),
  department_id: z.string().uuid().optional().nullable(),
  is_head_editable: z.boolean().optional(),
  priority: z.number().optional(),
});

const ticketSchema = z.object({
  question: z.string().min(1),
  source: z.string().optional(),
  status: z.string().optional(),
  assigned_to: z.string().uuid().optional().nullable(),
  resolution_notes: z.string().optional(),
});

const miniAdminSchema = z.object({
  name: z.string().min(1),
  username: z.string().min(3),
  password: z.string().min(6).optional(),
  role: z.string().min(1),
  scope_type: z.string().optional(),
  scope_value: z.string().optional(),
  email: z.string().email().optional(),
  permissions: z.any().optional(),
});

const announcementSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  priority: z.string().optional(),
  is_pinned: z.boolean().optional(),
  expiry_date: z.string().optional().nullable(),
  department_id: z.string().uuid().optional().nullable(),
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function generateSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function generateCode(prefix: string, length: number = 3): string {
  const random = Math.floor(Math.random() * Math.pow(10, length));
  return `${prefix}-${String(random).padStart(length, '0')}`;
}

function generatePassword(length: number = 12): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

// ============================================================================
// MAIN ROUTES FUNCTION
// ============================================================================

export function registerCourtAdminRoutes(app: Express) {
  
  // ============================================================================
  // AUTHENTICATION
  // ============================================================================
  
  app.post("/api/court-admin/login", async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      // Hardcoded fallback credentials (always works even if DB is unavailable)
      if (username === 'admin' && password === 'admin123') {
        return res.json({
          success: true,
          admin: {
            id: 1,
            username: 'admin',
            full_name: 'Court Administrator',
            email: 'admin@kaithalcourt.gov.in'
          }
        });
      }

      // Try Supabase as secondary check
      try {
        const { data: admin, error } = await supabase
          .from('court_main_admin')
          .select('*')
          .eq('username', username)
          .single();

        if (!error && admin) {
          const isValid = await bcrypt.compare(password, admin.password);
          if (isValid) {
            return res.json({
              success: true,
              admin: {
                id: admin.id,
                username: admin.username,
                full_name: admin.full_name,
                email: admin.email
              }
            });
          }
        }
      } catch (dbErr) {
        console.warn('Court admin DB check failed (using hardcoded fallback only):', dbErr);
      }

      return res.status(401).json({ message: 'Invalid credentials' });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // ============================================================================
  // DASHBOARD STATS
  // ============================================================================
  
  app.get("/api/court-admin/stats", async (req: Request, res: Response) => {
    try {
      const [buildings, rooms, staff, departments, tickets, faqs] = await Promise.all([
        supabase.from('court_buildings').select('id', { count: 'exact', head: true }),
        supabase.from('court_rooms').select('id', { count: 'exact', head: true }),
        supabase.from('court_staff').select('id', { count: 'exact', head: true }),
        supabase.from('court_departments').select('id', { count: 'exact', head: true }),
        supabase.from('court_tickets').select('id', { count: 'exact', head: true }).eq('status', 'Pending'),
        supabase.from('court_faqs').select('id', { count: 'exact', head: true }),
      ]);
      
      res.json({
        buildings: buildings.count || 0,
        rooms: rooms.count || 0,
        staff: staff.count || 0,
        departments: departments.count || 0,
        pending_tickets: tickets.count || 0,
        faqs: faqs.count || 0,
      });
    } catch (error: any) {
      console.error('Stats error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // ============================================================================
  // GENERAL INFO (COURT SETTINGS)
  // ============================================================================
  
  app.get("/api/court-admin/general-info", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('court_settings')
        .select('*')
        .eq('key', 'court_basic_info')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      res.json({ data: data?.value || {} });
    } catch (error: any) {
      console.error('General info error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/court-admin/general-info", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('court_settings')
        .upsert({
          key: 'court_basic_info',
          value: req.body,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (error) throw error;
      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Update general info error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // ============================================================================
  // BUILDINGS
  // ============================================================================
  
  app.get("/api/court-admin/buildings", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('court_buildings')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      res.json({ buildings: data || [] });
    } catch (error: any) {
      console.error('Get buildings error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/court-admin/buildings", async (req: Request, res: Response) => {
    try {
      const validated = buildingSchema.parse(req.body);
      
      const { data, error } = await supabase
        .from('court_buildings')
        .insert({
          ...validated,
          is_active: true
        })
        .select()
        .single();
      
      if (error) throw error;
      res.json({ success: true, building: data });
    } catch (error: any) {
      console.error('Create building error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.put("/api/court-admin/buildings/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validated = buildingSchema.parse(req.body);
      
      const { data, error } = await supabase
        .from('court_buildings')
        .update(validated)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      res.json({ success: true, building: data });
    } catch (error: any) {
      console.error('Update building error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.delete("/api/court-admin/buildings/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const { error } = await supabase
        .from('court_buildings')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      console.error('Delete building error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // ============================================================================
  // ROOMS
  // ============================================================================
  
  app.get("/api/court-admin/rooms", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('court_rooms')
        .select(`
          *,
          building:court_buildings(id, name, building_code),
          in_charge:court_staff(id, full_name, designation)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      res.json({ rooms: data || [] });
    } catch (error: any) {
      console.error('Get rooms error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/court-admin/rooms", async (req: Request, res: Response) => {
    try {
      const validated = roomSchema.parse(req.body);
      
      const { data, error } = await supabase
        .from('court_rooms')
        .insert({
          ...validated,
          is_active: true
        })
        .select()
        .single();
      
      if (error) throw error;
      res.json({ success: true, room: data });
    } catch (error: any) {
      console.error('Create room error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.put("/api/court-admin/rooms/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validated = roomSchema.parse(req.body);
      
      const { data, error } = await supabase
        .from('court_rooms')
        .update(validated)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      res.json({ success: true, room: data });
    } catch (error: any) {
      console.error('Update room error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.delete("/api/court-admin/rooms/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const { error } = await supabase
        .from('court_rooms')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      console.error('Delete room error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // ============================================================================
  // STAFF
  // ============================================================================
  
  app.get("/api/court-admin/staff", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('court_staff')
        .select(`
          *,
          department:court_departments(id, name),
          building:court_buildings(id, name),
          room:court_rooms(id, room_number, room_name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      res.json({ staff: data || [] });
    } catch (error: any) {
      console.error('Get staff error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/court-admin/staff", async (req: Request, res: Response) => {
    try {
      let validated = staffSchema.parse(req.body);
      
      // Check for existing employee_id and generate unique one if needed
      const { data: existing } = await supabase
        .from('court_staff')
        .select('employee_id')
        .eq('employee_id', validated.employee_id)
        .single();
      
      if (existing) {
        const { data: allStaff } = await supabase
          .from('court_staff')
          .select('employee_id')
          .order('created_at', { ascending: false });
        
        const maxNumber = (allStaff || []).reduce((max, staff) => {
          const match = staff.employee_id.match(/EMP-(\d+)/);
          if (match) {
            const num = parseInt(match[1]);
            return num > max ? num : max;
          }
          return max;
        }, 0);
        
        validated.employee_id = `EMP-${String(maxNumber + 1).padStart(3, '0')}`;
      }
      
      const { data, error } = await supabase
        .from('court_staff')
        .insert({
          ...validated,
          is_active: true
        })
        .select()
        .single();
      
      if (error) throw error;
      res.json({ success: true, staff: data });
    } catch (error: any) {
      console.error('Create staff error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.put("/api/court-admin/staff/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validated = staffSchema.parse(req.body);
      
      const { data, error } = await supabase
        .from('court_staff')
        .update(validated)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      res.json({ success: true, staff: data });
    } catch (error: any) {
      console.error('Update staff error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.delete("/api/court-admin/staff/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const { error } = await supabase
        .from('court_staff')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      console.error('Delete staff error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // ============================================================================
  // DEPARTMENTS
  // ============================================================================
  
  app.get("/api/court-admin/departments", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('court_departments')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      res.json({ departments: data || [] });
    } catch (error: any) {
      console.error('Get departments error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/court-admin/departments", async (req: Request, res: Response) => {
    try {
      const validated = departmentSchema.parse(req.body);
      
      const { data, error } = await supabase
        .from('court_departments')
        .insert({
          ...validated,
          is_active: true
        })
        .select()
        .single();
      
      if (error) throw error;
      res.json({ success: true, department: data });
    } catch (error: any) {
      console.error('Create department error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.put("/api/court-admin/departments/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validated = departmentSchema.parse(req.body);
      
      const { data, error } = await supabase
        .from('court_departments')
        .update(validated)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      res.json({ success: true, department: data });
    } catch (error: any) {
      console.error('Update department error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.delete("/api/court-admin/departments/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const { error } = await supabase
        .from('court_departments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      console.error('Delete department error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // ============================================================================
  // FAQs
  // ============================================================================
  
  app.get("/api/court-admin/faqs", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('court_faqs')
        .select(`
          *,
          department:court_departments(id, name)
        `)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      res.json({ faqs: data || [] });
    } catch (error: any) {
      console.error('Get FAQs error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/court-admin/faqs", async (req: Request, res: Response) => {
    try {
      const validated = faqSchema.parse(req.body);
      
      const { data, error } = await supabase
        .from('court_faqs')
        .insert({
          ...validated,
          is_active: true
        })
        .select()
        .single();
      
      if (error) throw error;
      res.json({ success: true, faq: data });
    } catch (error: any) {
      console.error('Create FAQ error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.put("/api/court-admin/faqs/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validated = faqSchema.parse(req.body);
      
      const { data, error } = await supabase
        .from('court_faqs')
        .update(validated)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      res.json({ success: true, faq: data });
    } catch (error: any) {
      console.error('Update FAQ error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.delete("/api/court-admin/faqs/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const { error } = await supabase
        .from('court_faqs')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      console.error('Delete FAQ error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // ============================================================================
  // TICKETS (UNANSWERED QUERIES)
  // ============================================================================
  
  app.get("/api/court-admin/tickets", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('court_tickets')
        .select(`
          *,
          assigned:court_mini_admins(id, name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      res.json({ tickets: data || [] });
    } catch (error: any) {
      console.error('Get tickets error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/court-admin/tickets", async (req: Request, res: Response) => {
    try {
      const validated = ticketSchema.parse(req.body);
      
      const { data, error } = await supabase
        .from('court_tickets')
        .insert(validated)
        .select()
        .single();
      
      if (error) throw error;
      res.json({ success: true, ticket: data });
    } catch (error: any) {
      console.error('Create ticket error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.put("/api/court-admin/tickets/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validated = ticketSchema.parse(req.body);
      
      // If marking as resolved, set resolved_at
      if (validated.status === 'Resolved' && !req.body.resolved_at) {
        (validated as any).resolved_at = new Date().toISOString();
      }
      
      const { data, error } = await supabase
        .from('court_tickets')
        .update(validated)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      res.json({ success: true, ticket: data });
    } catch (error: any) {
      console.error('Update ticket error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.delete("/api/court-admin/tickets/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const { error } = await supabase
        .from('court_tickets')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      console.error('Delete ticket error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // ============================================================================
  // MINI ADMINS
  // ============================================================================
  
  app.get("/api/court-admin/mini-admins", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('court_mini_admins')
        .select('id, name, username, role, scope_type, scope_value, panel_link, email, is_active, created_at')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      res.json({ miniAdmins: data || [] });
    } catch (error: any) {
      console.error('Get mini admins error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/court-admin/mini-admins", async (req: Request, res: Response) => {
    try {
      const validated = miniAdminSchema.parse(req.body);
      
      const password = validated.password || generatePassword();
      const hashedPassword = await bcrypt.hash(password, 10);
      const panelLink = `/court-mini-admin/${validated.username}`;
      
      const { data, error } = await supabase
        .from('court_mini_admins')
        .insert({
          ...validated,
          password: hashedPassword,
          panel_link: panelLink,
          is_active: true
        })
        .select()
        .single();
      
      if (error) throw error;
      
      res.json({ 
        success: true, 
        miniAdmin: data,
        credentials: {
          username: validated.username,
          password: password,
          panel_link: panelLink
        }
      });
    } catch (error: any) {
      console.error('Create mini admin error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/court-admin/mini-admins/:id/regenerate", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { adminPassword } = req.body;
      
      // Verify main admin password
      const { data: admin } = await supabase
        .from('court_main_admin')
        .select('password')
        .eq('username', 'admin')
        .single();
      
      if (!admin || !(await bcrypt.compare(adminPassword, admin.password))) {
        return res.status(401).json({ message: 'Invalid admin password' });
      }
      
      const newPassword = generatePassword();
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      const { data, error } = await supabase
        .from('court_mini_admins')
        .update({ password: hashedPassword })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      res.json({ 
        success: true,
        newPassword: newPassword
      });
    } catch (error: any) {
      console.error('Regenerate password error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.delete("/api/court-admin/mini-admins/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const { error } = await supabase
        .from('court_mini_admins')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      console.error('Delete mini admin error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // ============================================================================
  // ANNOUNCEMENTS
  // ============================================================================
  
  app.get("/api/court-admin/announcements", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('court_announcements')
        .select(`
          *,
          department:court_departments(id, name)
        `)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      res.json({ announcements: data || [] });
    } catch (error: any) {
      console.error('Get announcements error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/court-admin/announcements", async (req: Request, res: Response) => {
    try {
      const validated = announcementSchema.parse(req.body);
      
      const { data, error } = await supabase
        .from('court_announcements')
        .insert({
          ...validated,
          is_active: true
        })
        .select()
        .single();
      
      if (error) throw error;
      res.json({ success: true, announcement: data });
    } catch (error: any) {
      console.error('Create announcement error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.put("/api/court-admin/announcements/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const validated = announcementSchema.parse(req.body);
      
      const { data, error } = await supabase
        .from('court_announcements')
        .update(validated)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      res.json({ success: true, announcement: data });
    } catch (error: any) {
      console.error('Update announcement error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.delete("/api/court-admin/announcements/:id", async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      const { error } = await supabase
        .from('court_announcements')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      console.error('Delete announcement error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // HOLIDAYS (for Calendar)
  // ============================================================================
  
  app.get("/api/court-admin/holidays", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('court_settings')
        .select('*')
        .eq('key', 'court_holidays')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      const parsedValue = data?.value ? (typeof data.value === 'string' ? JSON.parse(data.value) : data.value) : { holidays: [] };
      res.json(parsedValue);
    } catch (error: any) {
      console.error('Get holidays error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/court-admin/holidays", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('court_settings')
        .upsert({
          key: 'court_holidays',
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
      console.error('Save holidays error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // ADDITIONAL INFORMATION
  // ============================================================================
  
  app.get("/api/court-admin/additional-info", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('court_settings')
        .select('*')
        .eq('key', 'court_additional_info')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      const parsedValue = data?.value ? (typeof data.value === 'string' ? JSON.parse(data.value) : data.value) : { entries: [] };
      res.json(parsedValue);
    } catch (error: any) {
      console.error('Get additional info error:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  app.post("/api/court-admin/additional-info", async (req: Request, res: Response) => {
    try {
      const { data, error } = await supabase
        .from('court_settings')
        .upsert({
          key: 'court_additional_info',
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
      console.error('Save additional info error:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // ============================================================================
  // AI GENERATION (for Additional Information)
  // ============================================================================
  
  app.post("/api/court-admin/ai-generate", async (req: Request, res: Response) => {
    try {
      const { prompt, type } = req.body;

      if (!prompt) {
        return res.status(400).json({ message: "Prompt is required" });
      }

      // Get API key from environment - using the same key as RKSD admin
      const groqApiKey = process.env.GROQ_API_KEY;
      if (!groqApiKey) {
        return res.status(500).json({ 
          message: "AI generation is not configured. Please contact administrator." 
        });
      }

      // Construct system prompt for court information
      let systemPrompt = "";
      if (type === "court_additional_info") {
        systemPrompt = `You are an AI assistant helping court administrators add structured information to their court management system.

When given a description of one or more pieces of information to add, you must extract and structure it into the following JSON format:
{
  "entries": [
    {
      "title": "Clear, concise title for the information",
      "category": "Category (e.g., Procedures, Services, Guidelines, Timings, etc.)",
      "content": "Detailed, well-formatted content describing the information. Make it professional and clear."
    }
  ]
}

Guidelines:
- If MULTIPLE pieces of information are mentioned, create SEPARATE entries for EACH in the "entries" array
- If ONLY ONE piece of information is mentioned, still return an array with one entry
- Keep titles short and descriptive (max 50 characters)
- Choose appropriate categories based on the content
- Make content clear, professional, and detailed
- Use proper grammar and formatting
- If timings are mentioned, format them properly (e.g., 12:00 PM, 9:00 AM)

EXAMPLES:
User: "Add visiting hours and security protocols"
Response: {"entries": [{"title": "Visiting Hours", "category": "Timings", ...}, {"title": "Security Protocols", "category": "Guidelines", ...}]}

Return ONLY the JSON object, no additional text or explanation.`;
      } else {
        systemPrompt = `You are an AI assistant helping to generate structured court-related information.
Generate information based on the user's description in this JSON format:
{
  "entries": [
    {
      "title": "Title of the information",
      "category": "Category (optional)",
      "content": "Detailed content"
    }
  ]
}

Return ONLY the JSON object.`;
      }

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

      // Parse the JSON response
      let parsedData;
      try {
        // Extract JSON from markdown code blocks if present
        const jsonMatch = generatedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/) || generatedText.match(/\{[\s\S]*\}/);
        const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : generatedText;
        parsedData = JSON.parse(jsonStr.trim());
      } catch (parseError) {
        console.error('JSON parse error:', parseError, 'Raw text:', generatedText);
        return res.status(500).json({ message: 'Failed to parse AI response' });
      }

      res.json(parsedData);
    } catch (error: any) {
      console.error('AI generate error:', error);
      res.status(500).json({ message: error.message || 'AI generation failed' });
    }
  });
}
