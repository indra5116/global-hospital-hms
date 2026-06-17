import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, appointmentsTable, patientsTable } from "@workspace/db";
import {
  ListAppointmentsQueryParams,
  ListAppointmentsResponse,
  CreateAppointmentBody,
  UpdateAppointmentParams,
  UpdateAppointmentBody,
  UpdateAppointmentResponse,
  DeleteAppointmentParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function ser(a: any) {
  return { ...a, createdAt: a.createdAt instanceof Date ? a.createdAt.toISOString() : a.createdAt };
}

router.get("/appointments", async (req, res): Promise<void> => {
  const query = ListAppointmentsQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }

  const { date, patientId, status } = query.data;
  const conditions: ReturnType<typeof eq>[] = [];
  if (date) conditions.push(eq(appointmentsTable.date, date));
  if (patientId) conditions.push(eq(appointmentsTable.patientId, patientId));
  if (status) conditions.push(eq(appointmentsTable.status, status));

  const appointments = await db.select().from(appointmentsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(appointmentsTable.date);

  res.json(ListAppointmentsResponse.parse(appointments.map(ser)));
});

router.post("/appointments", async (req, res): Promise<void> => {
  const parsed = CreateAppointmentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [patient] = await db.select().from(patientsTable).where(eq(patientsTable.id, parsed.data.patientId));
  const patientName = patient?.name ?? "Unknown";

  const [appointment] = await db.insert(appointmentsTable).values({ ...parsed.data, patientName }).returning();
  res.status(201).json(ser(appointment));
});

router.patch("/appointments/:id", async (req, res): Promise<void> => {
  const params = UpdateAppointmentParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateAppointmentBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [appointment] = await db.update(appointmentsTable).set(parsed.data).where(eq(appointmentsTable.id, params.data.id)).returning();
  if (!appointment) { res.status(404).json({ error: "Appointment not found" }); return; }
  res.json(UpdateAppointmentResponse.parse(ser(appointment)));
});

router.delete("/appointments/:id", async (req, res): Promise<void> => {
  const params = DeleteAppointmentParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [appointment] = await db.delete(appointmentsTable).where(eq(appointmentsTable.id, params.data.id)).returning();
  if (!appointment) { res.status(404).json({ error: "Appointment not found" }); return; }
  res.sendStatus(204);
});

export default router;
