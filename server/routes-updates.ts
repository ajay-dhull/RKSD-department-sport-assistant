/**
 * Updates & Email Subscription Routes
 *
 * Public:
 *   GET  /api/updates               — recent updates (all departments)
 *   POST /api/subscribe             — subscribe email
 *   POST /api/unsubscribe           — unsubscribe email
 *
 * Department (teacher authenticated):
 *   GET  /api/department/:id/updates        — get dept updates
 *   POST /api/department/:id/updates        — post new update (multipart/form-data)
 *   DELETE /api/department/:id/updates/:uid — delete update
 *
 * Head Admin:
 *   GET  /api/head-admin/subscribers        — list subscribers
 *   DELETE /api/head-admin/subscribers/:id  — remove subscriber
 *   POST /api/head-admin/updates            — admin posts global update
 *   POST /api/head-admin/send-test-email    — test email config
 */

import type { Express } from "express";
import multer from "multer";
import { supabase } from "./supabase";
import { sendUpdateToSubscribers, sendTestEmail } from "./email-service";
import { requireDepartmentAuth, validateDepartmentAccess } from "./department-auth";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/gif", "image/webp", "application/pdf"];
    cb(null, allowed.includes(file.mimetype));
  },
});

async function uploadFileToSupabase(
  buffer: Buffer,
  originalName: string,
  mimeType: string
): Promise<string | null> {
  const ext = originalName.split(".").pop();
  const fileName = `updates/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from("updates-files")
    .upload(fileName, buffer, { contentType: mimeType, upsert: false });
  if (error) {
    console.warn("Storage upload error:", error.message);
    return null;
  }
  const { data } = supabase.storage.from("updates-files").getPublicUrl(fileName);
  return data.publicUrl;
}

export function registerUpdatesRoutes(app: Express) {

  // ── PUBLIC: Get recent updates (all active departments) ─────────────────
  app.get("/api/updates", async (req, res) => {
    try {
      const limit = Math.min(Number(req.query.limit) || 20, 50);
      const { data, error } = await supabase
        .from("department_updates")
        .select("*, departments(name)")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) {
        if (error.code === '42P01') return res.json({ updates: [] }); // table not yet created
        throw error;
      }
      res.json({ updates: data });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── PUBLIC: Subscribe email ────────────────────────────────────────────
  app.post("/api/subscribe", async (req, res) => {
    try {
      const { email, name, class_info } = req.body;
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ message: "Valid email required" });
      }
      const displayName = [name?.trim(), class_info?.trim()].filter(Boolean).join(" — ") || null;
      const { error } = await supabase
        .from("email_subscribers")
        .upsert({ email: email.toLowerCase().trim(), name: displayName, is_active: true, unsubscribed_at: null }, { onConflict: "email" });
      if (error) {
        if (error.code === '42P01') return res.json({ success: true, message: "Subscribed! (tables pending setup)" });
        throw error;
      }
      res.json({ success: true, message: "Successfully subscribed!" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── PUBLIC: Unsubscribe email ──────────────────────────────────────────
  app.post("/api/unsubscribe", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Email required" });
      await supabase
        .from("email_subscribers")
        .update({ is_active: false, unsubscribed_at: new Date().toISOString() })
        .eq("email", email.toLowerCase().trim());
      res.json({ success: true, message: "Unsubscribed successfully" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── DEPARTMENT: Get updates for this department ─────────────────────────
  app.get(
    "/api/department/:departmentId/updates",
    requireDepartmentAuth,
    validateDepartmentAccess,
    async (req, res) => {
      try {
        const { departmentId } = req.params;
        const { data, error } = await supabase
          .from("department_updates")
          .select("*")
          .eq("department_id", departmentId)
          .order("created_at", { ascending: false })
          .limit(30);
        if (error) {
          if (error.code === '42P01') return res.json({ updates: [] });
          throw error;
        }
        res.json({ updates: data });
      } catch (err: any) {
        res.status(500).json({ message: err.message });
      }
    }
  );

  // ── DEPARTMENT: Post new update (with optional file) ───────────────────
  app.post(
    "/api/department/:departmentId/updates",
    requireDepartmentAuth,
    validateDepartmentAccess,
    upload.single("file"),
    async (req, res) => {
      try {
        const { departmentId } = req.params;
        const { title, content, update_type = "general" } = req.body;

        if (!title?.trim() || !content?.trim()) {
          return res.status(400).json({ message: "Title and content required" });
        }

        let file_url: string | null = null;
        let file_name: string | null = null;
        let file_type: string | null = null;

        if (req.file) {
          file_url = await uploadFileToSupabase(req.file.buffer, req.file.originalname, req.file.mimetype);
          file_name = req.file.originalname;
          file_type = req.file.mimetype;
        }

        // Get department name for email
        const { data: dept } = await supabase
          .from("departments")
          .select("name")
          .eq("id", departmentId)
          .single();

        const { data: update, error } = await supabase
          .from("department_updates")
          .insert({
            department_id: departmentId,
            title: title.trim(),
            content: content.trim(),
            update_type,
            file_url,
            file_name,
            file_type,
            posted_by: "teacher",
          })
          .select()
          .single();

        if (error) {
          if (error.code === '42P01') return res.status(503).json({ message: "Updates table not yet created. Please run database setup from Supabase SQL Editor." });
          throw error;
        }

        // Send email to subscribers (async, don't block response)
        const postedAt = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
        sendUpdateToSubscribers({
          title: title.trim(),
          content: content.trim(),
          updateType: update_type,
          departmentName: dept?.name,
          fileUrl: file_url || undefined,
          fileName: file_name || undefined,
          fileType: file_type || undefined,
          postedAt,
        }).then(count => {
          if (count > 0) {
            supabase.from("department_updates").update({ email_sent: true }).eq("id", update.id);
          }
        });

        res.json({ update });
      } catch (err: any) {
        console.error("Error posting update:", err);
        res.status(500).json({ message: err.message });
      }
    }
  );

  // ── DEPARTMENT: Delete update ──────────────────────────────────────────
  app.delete(
    "/api/department/:departmentId/updates/:updateId",
    requireDepartmentAuth,
    validateDepartmentAccess,
    async (req, res) => {
      try {
        const { departmentId, updateId } = req.params;
        const { error } = await supabase
          .from("department_updates")
          .delete()
          .eq("id", updateId)
          .eq("department_id", departmentId);
        if (error) throw error;
        res.json({ success: true });
      } catch (err: any) {
        res.status(500).json({ message: err.message });
      }
    }
  );

  // ── HEAD ADMIN: List subscribers ───────────────────────────────────────
  app.get("/api/head-admin/subscribers", async (_req, res) => {
    try {
      const { data, error } = await supabase
        .from("email_subscribers")
        .select("*")
        .order("subscribed_at", { ascending: false });
      if (error) {
        if (error.code === '42P01') return res.json({ subscribers: [] });
        throw error;
      }
      res.json({ subscribers: data });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── HEAD ADMIN: Delete subscriber ─────────────────────────────────────
  app.delete("/api/head-admin/subscribers/:id", async (req, res) => {
    try {
      const { error } = await supabase
        .from("email_subscribers")
        .delete()
        .eq("id", req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── HEAD ADMIN: Delete an update ─────────────────────────────────────
  app.delete("/api/head-admin/updates/:id", async (req, res) => {
    try {
      const { error } = await supabase
        .from("department_updates")
        .delete()
        .eq("id", req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── HEAD ADMIN: Post global update (to all) ───────────────────────────
  app.post("/api/head-admin/updates", upload.single("file"), async (req, res) => {
    try {
      const { title, content, update_type = "general" } = req.body;
      if (!title?.trim() || !content?.trim()) {
        return res.status(400).json({ message: "Title and content required" });
      }

      let file_url: string | null = null;
      let file_name: string | null = null;
      let file_type: string | null = null;

      if (req.file) {
        file_url = await uploadFileToSupabase(req.file.buffer, req.file.originalname, req.file.mimetype);
        file_name = req.file.originalname;
        file_type = req.file.mimetype;
      }

      const { data: update, error } = await supabase
        .from("department_updates")
        .insert({
          department_id: null, // global update
          title: title.trim(),
          content: content.trim(),
          update_type,
          file_url,
          file_name,
          file_type,
          posted_by: "admin",
        })
        .select()
        .single();

      if (error) {
        if (error.code === '42P01') return res.status(503).json({ message: "Updates table not yet created. Please run new-tables.sql in Supabase SQL Editor." });
        throw error;
      }

      const postedAt = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      sendUpdateToSubscribers({
        title: title.trim(),
        content: content.trim(),
        updateType: update_type,
        departmentName: "Administration",
        fileUrl: file_url || undefined,
        fileName: file_name || undefined,
        postedAt,
      }).then(count => {
        if (count > 0) {
          supabase.from("department_updates").update({ email_sent: true }).eq("id", update.id);
        }
      });

      res.json({ update });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // ── HEAD ADMIN: Test email config ─────────────────────────────────────
  app.post("/api/head-admin/send-test-email", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ message: "Email required" });
      const ok = await sendTestEmail(email);
      res.json({ success: ok, message: ok ? "Test email sent!" : "Failed — check EMAIL_USER/EMAIL_PASS env vars" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });
}
