import { Router, type IRouter } from "express";
import { eq, and, ilike, lte } from "drizzle-orm";
import { db, medicinesTable, pharmacyBillsTable, patientsTable } from "@workspace/db";
import {
  ListMedicinesQueryParams,
  ListMedicinesResponse,
  CreateMedicineBody,
  UpdateMedicineParams,
  UpdateMedicineBody,
  UpdateMedicineResponse,
  DeleteMedicineParams,
  ListPharmacyBillsQueryParams,
  ListPharmacyBillsResponse,
  CreatePharmacyBillBody,
  GetPharmacyBillParams,
  GetPharmacyBillResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeMedicine(m: any) {
  return { ...m, unitPrice: Number(m.unitPrice), quantity: Number(m.quantity), minStock: Number(m.minStock), createdAt: m.createdAt instanceof Date ? m.createdAt.toISOString() : m.createdAt };
}

function serializeBill(b: any) {
  return { ...b, totalAmount: Number(b.totalAmount), discount: Number(b.discount), netAmount: Number(b.netAmount), items: b.items as any[], createdAt: b.createdAt instanceof Date ? b.createdAt.toISOString() : b.createdAt };
}

function buildBillNumber(id: number): string {
  const now = new Date();
  const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}`;
  return `PH-${yyyymm}-${String(id).padStart(4, "0")}`;
}

// ─── Medicines ───────────────────────────────────────────────
router.get("/pharmacy/medicines", async (req, res): Promise<void> => {
  const query = ListMedicinesQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }

  const { search, lowStock, expiringSoon } = query.data;
  let medicines = await db.select().from(medicinesTable).orderBy(medicinesTable.name);

  if (search) {
    const lower = search.toLowerCase();
    medicines = medicines.filter(m => m.name.toLowerCase().includes(lower) || m.genericName.toLowerCase().includes(lower) || m.category.toLowerCase().includes(lower));
  }
  if (lowStock) {
    medicines = medicines.filter(m => Number(m.quantity) <= Number(m.minStock));
  }
  if (expiringSoon) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + 90);
    const cutoffStr = cutoff.toISOString().split("T")[0];
    medicines = medicines.filter(m => m.expiryDate <= cutoffStr);
  }

  res.json(ListMedicinesResponse.parse(medicines.map(serializeMedicine)));
});

router.post("/pharmacy/medicines", async (req, res): Promise<void> => {
  const parsed = CreateMedicineBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [medicine] = await db.insert(medicinesTable).values(parsed.data).returning();
  res.status(201).json(serializeMedicine(medicine));
});

router.patch("/pharmacy/medicines/:id", async (req, res): Promise<void> => {
  const params = UpdateMedicineParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateMedicineBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [medicine] = await db.update(medicinesTable).set(parsed.data).where(eq(medicinesTable.id, params.data.id)).returning();
  if (!medicine) { res.status(404).json({ error: "Medicine not found" }); return; }
  res.json(UpdateMedicineResponse.parse(serializeMedicine(medicine)));
});

router.delete("/pharmacy/medicines/:id", async (req, res): Promise<void> => {
  const params = DeleteMedicineParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [medicine] = await db.delete(medicinesTable).where(eq(medicinesTable.id, params.data.id)).returning();
  if (!medicine) { res.status(404).json({ error: "Medicine not found" }); return; }
  res.sendStatus(204);
});

// ─── Pharmacy Bills ──────────────────────────────────────────
router.get("/pharmacy/bills", async (req, res): Promise<void> => {
  const query = ListPharmacyBillsQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }

  const { patientId, date } = query.data;
  const conditions: ReturnType<typeof eq>[] = [];
  if (patientId) conditions.push(eq(pharmacyBillsTable.patientId, patientId));
  if (date) conditions.push(eq(pharmacyBillsTable.billDate, date));

  const bills = await db.select().from(pharmacyBillsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(pharmacyBillsTable.createdAt);

  res.json(ListPharmacyBillsResponse.parse(bills.map(serializeBill)));
});

router.post("/pharmacy/bills", async (req, res): Promise<void> => {
  const parsed = CreatePharmacyBillBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, parsed.data.patientId));
  if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }

  const billItems: any[] = [];
  let totalAmount = 0;

  for (const item of parsed.data.items) {
    const [medicine] = await db.select().from(medicinesTable).where(eq(medicinesTable.id, item.medicineId));
    if (!medicine) { res.status(404).json({ error: `Medicine ${item.medicineId} not found` }); return; }
    const unitPrice = Number(medicine.unitPrice);
    const totalPrice = unitPrice * item.quantity;
    totalAmount += totalPrice;
    billItems.push({ medicineId: medicine.id, medicineName: medicine.name, quantity: item.quantity, unitPrice, totalPrice });

    // Deduct stock
    await db.update(medicinesTable)
      .set({ quantity: Number(medicine.quantity) - item.quantity })
      .where(eq(medicinesTable.id, medicine.id));
  }

  const discount = Number(parsed.data.discount ?? 0);
  const netAmount = totalAmount - discount;

  const [bill] = await db.insert(pharmacyBillsTable).values({
    billNumber: "PH-TMP",
    patientId: patient.id,
    patientName: patient.name,
    totalAmount: String(totalAmount),
    discount: String(discount),
    netAmount: String(netAmount),
    paymentMode: parsed.data.paymentMode,
    billDate: parsed.data.billDate,
    items: billItems,
  }).returning();

  // Update bill number with real ID
  const realBillNumber = buildBillNumber(bill.id);
  const [updated] = await db.update(pharmacyBillsTable).set({ billNumber: realBillNumber }).where(eq(pharmacyBillsTable.id, bill.id)).returning();

  res.status(201).json(serializeBill(updated));
});

router.get("/pharmacy/bills/:id", async (req, res): Promise<void> => {
  const params = GetPharmacyBillParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [bill] = await db.select().from(pharmacyBillsTable).where(eq(pharmacyBillsTable.id, params.data.id));
  if (!bill) { res.status(404).json({ error: "Bill not found" }); return; }
  res.json(GetPharmacyBillResponse.parse(serializeBill(bill)));
});

export default router;
