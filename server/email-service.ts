/**
 * Email Service — Uses Gmail SMTP via nodemailer
 *
 * Required env vars:
 *   EMAIL_USER  — Gmail address (e.g. yourname@gmail.com)
 *   EMAIL_PASS  — Gmail App Password (not your normal password)
 *                 Generate at: Google Account → Security → App passwords
 *   EMAIL_FROM_NAME — Display name (e.g. "RKSD College Updates")
 */

import nodemailer from "nodemailer";
import { supabase } from "./supabase";

function getTransporter() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;
  if (!user || !pass) return null;
  return nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });
}

export interface UpdateEmailData {
  title: string;
  content: string;
  updateType: string;
  departmentName?: string;
  fileUrl?: string;
  fileName?: string;
  fileType?: string;
  postedAt: string;
}

function updateTypeLabel(type: string): string {
  const map: Record<string, string> = {
    class_timing: "Class Timing Update",
    notice: "Notice",
    event: "Event",
    general: "General Update",
  };
  return map[type] || "Update";
}

function buildEmailHtml(data: UpdateEmailData): string {
  const badgeColor: Record<string, string> = {
    class_timing: "#3B82F6",
    notice: "#F59E0B",
    event: "#8B5CF6",
    general: "#10B981",
  };
  const color = badgeColor[data.updateType] || "#6B7280";

  const fileSection =
    data.fileUrl && data.fileName
      ? `
    <div style="margin-top:16px; padding:12px; background:#F9FAFB; border:1px solid #E5E7EB; border-radius:8px;">
      <p style="margin:0; font-size:13px; color:#6B7280;">📎 Attachment:</p>
      <a href="${data.fileUrl}" style="color:#3B82F6; font-size:14px; font-weight:600;">${data.fileName}</a>
    </div>`
      : "";

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background:#F3F4F6; margin:0; padding:20px;">
  <div style="max-width:600px; margin:0 auto; background:#fff; border-radius:12px; overflow:hidden; box-shadow:0 4px 6px rgba(0,0,0,0.07);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#1E3A8A,#2563EB); padding:28px 32px;">
      <p style="margin:0; color:rgba(255,255,255,0.8); font-size:13px; letter-spacing:1px; text-transform:uppercase;">RKSD College — Physical Education Dept</p>
      <h1 style="margin:8px 0 0; color:#fff; font-size:22px; font-weight:700;">Department Update</h1>
    </div>

    <!-- Body -->
    <div style="padding:28px 32px;">
      <span style="display:inline-block; background:${color}; color:#fff; font-size:12px; font-weight:600; padding:4px 12px; border-radius:20px; margin-bottom:16px;">
        ${updateTypeLabel(data.updateType)}
      </span>
      ${data.departmentName ? `<p style="margin:0 0 4px; font-size:12px; color:#9CA3AF;">From: ${data.departmentName}</p>` : ""}
      <h2 style="margin:0 0 16px; font-size:20px; color:#111827;">${data.title}</h2>
      <div style="font-size:15px; color:#374151; line-height:1.7; white-space:pre-wrap;">${data.content}</div>
      ${fileSection}
      <p style="margin-top:20px; font-size:12px; color:#9CA3AF;">Posted on ${data.postedAt}</p>
    </div>

    <!-- Footer -->
    <div style="background:#F9FAFB; border-top:1px solid #E5E7EB; padding:16px 32px; text-align:center;">
      <p style="margin:0; font-size:12px; color:#9CA3AF;">
        You're receiving this because you subscribed to RKSD College updates.<br>
        To unsubscribe, reply with "UNSUBSCRIBE" or visit the college assistant page.
      </p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Send update notification to all active subscribers
 */
export async function sendUpdateToSubscribers(data: UpdateEmailData): Promise<number> {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn("⚠️ Email service not configured (EMAIL_USER/EMAIL_PASS missing)");
    return 0;
  }

  try {
    const { data: subscribers, error } = await supabase
      .from("email_subscribers")
      .select("email, name")
      .eq("is_active", true);

    if (error || !subscribers?.length) {
      console.log("📭 No active subscribers to email");
      return 0;
    }

    const html = buildEmailHtml(data);
    const fromName = process.env.EMAIL_FROM_NAME || "RKSD College";
    const fromEmail = process.env.EMAIL_USER!;
    const subject = `[RKSD Update] ${data.title}`;

    let sentCount = 0;
    // Send in batches of 10 to avoid rate limits
    for (let i = 0; i < subscribers.length; i += 10) {
      const batch = subscribers.slice(i, i + 10);
      await Promise.allSettled(
        batch.map(sub =>
          transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to: sub.email,
            subject,
            html,
          }).then(() => sentCount++).catch(err =>
            console.warn(`⚠️ Failed to send to ${sub.email}:`, err.message)
          )
        )
      );
    }

    console.log(`✅ Emails sent: ${sentCount}/${subscribers.length}`);
    return sentCount;
  } catch (err: any) {
    console.error("❌ Email send error:", err.message);
    return 0;
  }
}

/**
 * Send a single test email to verify configuration
 */
export async function sendTestEmail(toEmail: string): Promise<boolean> {
  const transporter = getTransporter();
  if (!transporter) return false;
  try {
    await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || "RKSD College"}" <${process.env.EMAIL_USER}>`,
      to: toEmail,
      subject: "RKSD College — Email Configuration Test",
      html: "<h2>✅ Email service is working correctly!</h2><p>Your RKSD College email notifications are set up.</p>",
    });
    return true;
  } catch {
    return false;
  }
}
