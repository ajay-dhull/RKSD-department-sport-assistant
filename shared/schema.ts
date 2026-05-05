import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// --- Multi-Tenant SaaS Tables ---

export const institutions = pgTable("institutions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  instId: text("inst_id").notNull().unique(), // Unique identifier like 'rksd-college'
  name: text("name").notNull(),
  type: text("type").notNull(), // 'college', 'court', 'hospital', etc.
  email: text("email").notNull().unique(),
  password: text("password").notNull(), // Institution admin password
  uiConfig: jsonb("ui_config").notNull().default({}), // Dynamic UI structure/options
  plan: text("plan").notNull().default("trial"), // 'trial', 'monthly', 'yearly'
  createdAt: timestamp("created_at").defaultNow(),
});

export const collegeInfo = pgTable("college_info", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: varchar("institution_id").references(() => institutions.id),
  category: text("category").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  metadata: text("metadata"),
});

export const chatMessages = pgTable("chat_messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: varchar("institution_id").references(() => institutions.id),
  content: text("content").notNull(),
  role: text("role").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  language: text("language"),
});

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  institutionId: varchar("institution_id").references(() => institutions.id),
  username: text("username").notNull(),
  password: text("password").notNull(),
});

// --- Existing logic (modified for multi-tenancy) ---

export const collegeSettings = pgTable("college_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  key: text("key").notNull().unique(),
  value: text("value").notNull(), // JSONB stored as text
  updated_at: timestamp("updated_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  timestamp: true,
});

export const insertCollegeInfoSchema = createInsertSchema(collegeInfo).omit({
  id: true,
});

export const insertCollegeSettingsSchema = createInsertSchema(collegeSettings).omit({
  id: true,
  updated_at: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type CollegeInfo = typeof collegeInfo.$inferSelect;
export type InsertCollegeInfo = z.infer<typeof insertCollegeInfoSchema>;
export type CollegeSettings = typeof collegeSettings.$inferSelect;
export type InsertCollegeSettings = z.infer<typeof insertCollegeSettingsSchema>;
