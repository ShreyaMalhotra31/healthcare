import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull(),
  location: text("location").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  fullName: true,
  role: true,
  location: true,
});

// Patient schema
export const patients = pgTable("patients", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  address: text("address").notNull(),
  contactNumber: text("contact_number"),
  riskLevel: text("risk_level").default("normal"),
  healthConcern: text("health_concern"),
  lastVisitDate: timestamp("last_visit_date").defaultNow(),
  userId: integer("user_id").notNull(),
});

export const insertPatientSchema = createInsertSchema(patients).pick({
  name: true,
  age: true,
  gender: true,
  address: true,
  contactNumber: true,
  riskLevel: true,
  healthConcern: true,
  userId: true,
});

// Pregnancy assessment schema
export const pregnancyAssessments = pgTable("pregnancy_assessments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  pregnancyWeek: integer("pregnancy_week").notNull(),
  bloodPressureSystolic: integer("blood_pressure_systolic"),
  bloodPressureDiastolic: integer("blood_pressure_diastolic"),
  symptoms: json("symptoms").notNull().$type<string[]>(),
  previousComplications: boolean("previous_complications"),
  isFirstPregnancy: boolean("is_first_pregnancy"),
  assessmentDate: timestamp("assessment_date").defaultNow(),
  riskLevel: text("risk_level").notNull(),
  recommendations: text("recommendations"),
  userId: integer("user_id").notNull(),
});

export const insertPregnancyAssessmentSchema = createInsertSchema(pregnancyAssessments).pick({
  patientId: true,
  pregnancyWeek: true,
  bloodPressureSystolic: true,
  bloodPressureDiastolic: true,
  symptoms: true,
  previousComplications: true,
  isFirstPregnancy: true,
  riskLevel: true,
  recommendations: true,
  userId: true,
});

// Child health assessment schema
export const childHealthAssessments = pgTable("child_health_assessments", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  weight: integer("weight"), // in grams
  height: integer("height"), // in cm
  hemoglobinLevel: integer("hemoglobin_level"), // in g/dL
  symptoms: json("symptoms").notNull().$type<string[]>(),
  nutritionalStatus: text("nutritional_status"),
  assessmentDate: timestamp("assessment_date").defaultNow(),
  riskLevel: text("risk_level").notNull(),
  recommendations: text("recommendations"),
  userId: integer("user_id").notNull(),
});

export const insertChildHealthAssessmentSchema = createInsertSchema(childHealthAssessments).pick({
  patientId: true,
  weight: true,
  height: true,
  hemoglobinLevel: true,
  symptoms: true,
  nutritionalStatus: true,
  riskLevel: true,
  recommendations: true,
  userId: true,
});

// Healthcare scheme schema
export const healthcareSchemes = pgTable("healthcare_schemes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  eligibilityCriteria: json("eligibility_criteria").notNull(),
  benefits: text("benefits").notNull(),
  applicationProcess: text("application_process").notNull(),
  state: text("state"), // If state-specific, otherwise null for national schemes
  targetGroup: text("target_group"), // E.g., "pregnant_women", "children", "elderly"
  incomeLimit: integer("income_limit"), // Maximum annual household income in INR
});

export const insertHealthcareSchemeSchema = createInsertSchema(healthcareSchemes).pick({
  name: true,
  description: true,
  eligibilityCriteria: true,
  benefits: true,
  applicationProcess: true,
  state: true,
  targetGroup: true,
  incomeLimit: true,
});

// Chat messages schema
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  message: text("message").notNull(),
  isUserMessage: boolean("is_user_message").notNull(),
  timestamp: timestamp("timestamp").defaultNow(),
  relatedPatientId: integer("related_patient_id"),
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  userId: true,
  message: true,
  isUserMessage: true,
  relatedPatientId: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;

export type PregnancyAssessment = typeof pregnancyAssessments.$inferSelect;
export type InsertPregnancyAssessment = z.infer<typeof insertPregnancyAssessmentSchema>;

export type ChildHealthAssessment = typeof childHealthAssessments.$inferSelect;
export type InsertChildHealthAssessment = z.infer<typeof insertChildHealthAssessmentSchema>;

export type HealthcareScheme = typeof healthcareSchemes.$inferSelect;
export type InsertHealthcareScheme = z.infer<typeof insertHealthcareSchemeSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
