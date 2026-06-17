import { Router, type IRouter } from "express";
import { db, patientsTable, appointmentsTable, labReportsTable, pharmacyBillsTable } from "@workspace/db";
import { eq, and, gte, sql } from "drizzle-orm";
import { GetDashboardSummaryResponse, GetRevenueTrendResponse, GetPatientStatsResponse } from "@workspace/api-zod";

const router: IRouter = Router();

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function dateStr(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
}

router.get("/dashboard/summary", async (_req, res): Promise<void> => {
  const today = todayStr();

  const [totalPatientsRow] = await db.select({ count: sql<number>`count(*)::int` }).from(patientsTable);
  const [opRow] = await db.select({ count: sql<number>`count(*)::int` }).from(patientsTable).where(eq(patientsTable.type, "OP"));
  const [ipRow] = await db.select({ count: sql<number>`count(*)::int` }).from(patientsTable).where(eq(patientsTable.type, "IP"));

  const [apptTodayRow] = await db.select({ count: sql<number>`count(*)::int` }).from(appointmentsTable).where(eq(appointmentsTable.date, today));
  const [labTodayRow] = await db.select({ count: sql<number>`count(*)::int` }).from(labReportsTable).where(eq(labReportsTable.reportDate, today));

  const labReportsToday = await db.select({ totalAmount: labReportsTable.totalAmount }).from(labReportsTable).where(eq(labReportsTable.reportDate, today));
  const labRevenue = labReportsToday.reduce((sum, r) => sum + Number(r.totalAmount), 0);

  const pharmBillsToday = await db.select({ netAmount: pharmacyBillsTable.netAmount }).from(pharmacyBillsTable).where(eq(pharmacyBillsTable.billDate, today));
  const pharmacyRevenue = pharmBillsToday.reduce((sum, b) => sum + Number(b.netAmount), 0);

  res.json(GetDashboardSummaryResponse.parse({
    totalPatients: totalPatientsRow?.count ?? 0,
    opPatients: opRow?.count ?? 0,
    ipPatients: ipRow?.count ?? 0,
    appointmentsToday: apptTodayRow?.count ?? 0,
    labReportsToday: labTodayRow?.count ?? 0,
    labRevenue,
    pharmacyRevenue,
    totalRevenue: labRevenue + pharmacyRevenue,
  }));
});

router.get("/dashboard/revenue-trend", async (_req, res): Promise<void> => {
  const trend = [];
  for (let i = 6; i >= 0; i--) {
    const date = dateStr(i);
    const labReports = await db.select({ totalAmount: labReportsTable.totalAmount }).from(labReportsTable).where(eq(labReportsTable.reportDate, date));
    const pharmBills = await db.select({ netAmount: pharmacyBillsTable.netAmount }).from(pharmacyBillsTable).where(eq(pharmacyBillsTable.billDate, date));
    const labRevenue = labReports.reduce((s, r) => s + Number(r.totalAmount), 0);
    const pharmacyRevenue = pharmBills.reduce((s, b) => s + Number(b.netAmount), 0);
    trend.push({ date, labRevenue, pharmacyRevenue, totalRevenue: labRevenue + pharmacyRevenue });
  }
  res.json(GetRevenueTrendResponse.parse(trend));
});

router.get("/dashboard/patient-stats", async (_req, res): Promise<void> => {
  const stats = [];
  for (let i = 6; i >= 0; i--) {
    const date = dateStr(i);
    const startOfDay = new Date(date + "T00:00:00Z");
    const endOfDay = new Date(date + "T23:59:59Z");
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(patientsTable)
      .where(and(gte(patientsTable.createdAt, startOfDay), gte(new Date(endOfDay.getTime() + 1), patientsTable.createdAt)));
    stats.push({ date, count: row?.count ?? 0 });
  }
  res.json(GetPatientStatsResponse.parse(stats));
});

export default router;
