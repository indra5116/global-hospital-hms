import { pgTable, text, serial, integer, numeric, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const medicinesTable = pgTable("medicines", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  genericName: text("generic_name").notNull(),
  category: text("category").notNull(),
  manufacturer: text("manufacturer").notNull(),
  quantity: integer("quantity").notNull().default(0),
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  expiryDate: text("expiry_date").notNull(),
  batchNumber: text("batch_number").notNull(),
  minStock: integer("min_stock").notNull().default(10),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertMedicineSchema = createInsertSchema(medicinesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertMedicine = z.infer<typeof insertMedicineSchema>;
export type Medicine = typeof medicinesTable.$inferSelect;

export const pharmacyBillsTable = pgTable("pharmacy_bills", {
  id: serial("id").primaryKey(),
  billNumber: text("bill_number").notNull().unique(),
  patientId: integer("patient_id").notNull(),
  patientName: text("patient_name").notNull(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull(),
  discount: numeric("discount", { precision: 10, scale: 2 }).notNull().default("0"),
  netAmount: numeric("net_amount", { precision: 10, scale: 2 }).notNull(),
  paymentMode: text("payment_mode").notNull().default("cash"),
  billDate: text("bill_date").notNull(),
  items: jsonb("items").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPharmacyBillSchema = createInsertSchema(pharmacyBillsTable).omit({ id: true, createdAt: true });
export type InsertPharmacyBill = z.infer<typeof insertPharmacyBillSchema>;
export type PharmacyBill = typeof pharmacyBillsTable.$inferSelect;
