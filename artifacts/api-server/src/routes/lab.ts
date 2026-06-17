import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, labTestsTable, labReportsTable, patientsTable } from "@workspace/db";
import {
  ListLabTestsResponse,
  CreateLabTestBody,
  UpdateLabTestParams,
  UpdateLabTestBody,
  UpdateLabTestResponse,
  DeleteLabTestParams,
  ListLabReportsQueryParams,
  ListLabReportsResponse,
  CreateLabReportBody,
  GetLabReportParams,
  GetLabReportResponse,
  UpdateLabReportParams,
  UpdateLabReportBody,
  UpdateLabReportResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serDate(obj: any) {
  return { ...obj, createdAt: obj.createdAt instanceof Date ? obj.createdAt.toISOString() : obj.createdAt };
}

// ─── Lab Tests (catalogue) ───────────────────────────────────
router.get("/lab/tests", async (_req, res): Promise<void> => {
  const tests = await db.select().from(labTestsTable).orderBy(labTestsTable.category);
  res.json(ListLabTestsResponse.parse(tests.map(t => serDate({ ...t, price: Number(t.price) }))));
});

router.post("/lab/tests", async (req, res): Promise<void> => {
  const parsed = CreateLabTestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [test] = await db.insert(labTestsTable).values(parsed.data).returning();
  res.status(201).json({ ...test, price: Number(test.price) });
});

router.patch("/lab/tests/:id", async (req, res): Promise<void> => {
  const params = UpdateLabTestParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateLabTestBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [test] = await db.update(labTestsTable).set(parsed.data).where(eq(labTestsTable.id, params.data.id)).returning();
  if (!test) { res.status(404).json({ error: "Lab test not found" }); return; }
  res.json(UpdateLabTestResponse.parse(serDate({ ...test, price: Number(test.price) })));
});

router.delete("/lab/tests/:id", async (req, res): Promise<void> => {
  const params = DeleteLabTestParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [test] = await db.delete(labTestsTable).where(eq(labTestsTable.id, params.data.id)).returning();
  if (!test) { res.status(404).json({ error: "Lab test not found" }); return; }
  res.sendStatus(204);
});

// ─── Lab Reports ────────────────────────────────────────────
router.get("/lab/reports", async (req, res): Promise<void> => {
  const query = ListLabReportsQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }

  const { patientId, date, status } = query.data;
  const conditions: ReturnType<typeof eq>[] = [];
  if (patientId) conditions.push(eq(labReportsTable.patientId, patientId));
  if (date) conditions.push(eq(labReportsTable.reportDate, date));
  if (status) conditions.push(eq(labReportsTable.status, status));

  const reports = await db.select().from(labReportsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(labReportsTable.createdAt);

  res.json(ListLabReportsResponse.parse(reports.map(r => serDate({ ...r, totalAmount: Number(r.totalAmount), items: r.items as any[] }))));
});

router.post("/lab/reports", async (req, res): Promise<void> => {
  const parsed = CreateLabReportBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, parsed.data.patientId));
  if (!patient) { res.status(404).json({ error: "Patient not found" }); return; }

  // Fetch test details and compute items + total
  const items: any[] = [];
  let totalAmount = 0;

  for (const item of parsed.data.items) {
    const [test] = await db.select().from(labTestsTable).where(eq(labTestsTable.id, item.labTestId));
    if (test) {
      const price = Number(test.price);
      totalAmount += price;
      items.push({
        labTestId: test.id,
        testName: test.name,
        result: item.result,
        referenceRange: test.referenceRange,
        unit: test.unit,
        isAbnormal: item.isAbnormal ?? false,
      });
    }
  }

  const [report] = await db.insert(labReportsTable).values({
    patientId: patient.id,
    patientName: patient.name,
    patientAge: patient.age,
    patientGender: patient.gender,
    referredBy: parsed.data.referredBy,
    reportDate: parsed.data.reportDate,
    notes: parsed.data.notes,
    totalAmount: String(totalAmount),
    status: "pending",
    items,
  }).returning();

  res.status(201).json(serDate({ ...report, totalAmount: Number(report.totalAmount), items: report.items as any[] }));
});

router.get("/lab/reports/:id", async (req, res): Promise<void> => {
  const params = GetLabReportParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [report] = await db.select().from(labReportsTable).where(eq(labReportsTable.id, params.data.id));
  if (!report) { res.status(404).json({ error: "Report not found" }); return; }
  res.json(GetLabReportResponse.parse(serDate({ ...report, totalAmount: Number(report.totalAmount), items: report.items as any[] })));
});

router.patch("/lab/reports/:id", async (req, res): Promise<void> => {
  const params = UpdateLabReportParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateLabReportBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const { items: inputItems, ...rest } = parsed.data;
  let updateData: Record<string, any> = { ...rest };

  if (inputItems) {
    const items: any[] = [];
    let totalAmount = 0;
    for (const item of inputItems) {
      const [test] = await db.select().from(labTestsTable).where(eq(labTestsTable.id, item.labTestId));
      if (test) {
        totalAmount += Number(test.price);
        items.push({ labTestId: test.id, testName: test.name, result: item.result, referenceRange: test.referenceRange, unit: test.unit, isAbnormal: item.isAbnormal ?? false });
      }
    }
    updateData = { ...updateData, items, totalAmount: String(totalAmount) };
  }

  const [report] = await db.update(labReportsTable).set(updateData).where(eq(labReportsTable.id, params.data.id)).returning();
  if (!report) { res.status(404).json({ error: "Report not found" }); return; }
  res.json(UpdateLabReportResponse.parse(serDate({ ...report, totalAmount: Number(report.totalAmount), items: report.items as any[] })));
});

export default router;
