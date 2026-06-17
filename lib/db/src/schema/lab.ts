import { pgTable, text, serial, integer, numeric, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const labTestsTable = pgTable("lab_tests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  referenceRange: text("reference_range").notNull(),
  unit: text("unit").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertLabTestSchema = createInsertSchema(labTestsTable).omit({ id: true, createdAt: true });
export type InsertLabTest = z.infer<typeof insertLabTestSchema>;
export type LabTest = typeof labTestsTable.$inferSelect;

export const labReportsTable = pgTable("lab_reports", {
  id: serial("id").primaryKey(),
  patientId: integer("patient_id").notNull(),
  patientName: text("patient_name").notNull(),
  patientAge: integer("patient_age"),
  patientGender: text("patient_gender"),
  referredBy: text("referred_by").notNull(),
  doctorSignature: text("doctor_signature"),
  status: text("status").notNull().default("pending"),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  reportDate: text("report_date").notNull(),
  notes: text("notes"),
  items: jsonb("items").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertLabReportSchema = createInsertSchema(labReportsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertLabReport = z.infer<typeof insertLabReportSchema>;
export type LabReport = typeof labReportsTable.$inferSelect;
