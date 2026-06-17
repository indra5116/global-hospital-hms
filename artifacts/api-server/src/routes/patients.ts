import { Router, type IRouter } from "express";
import { eq, ilike, or, and } from "drizzle-orm";
import { db, patientsTable } from "@workspace/db";
import {
  ListPatientsQueryParams,
  ListPatientsResponse,
  CreatePatientBody,
  GetPatientParams,
  GetPatientResponse,
  UpdatePatientParams,
  UpdatePatientBody,
  UpdatePatientResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function buildPatientId(id: number): string {
  return `GH-${String(id).padStart(5, "0")}`;
}

function serializePatient(p: any) {
  return { ...p, createdAt: p.createdAt instanceof Date ? p.createdAt.toISOString() : p.createdAt };
}

router.get("/patients", async (req, res): Promise<void> => {
  const query = ListPatientsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { search, type } = query.data;
  const conditions: ReturnType<typeof eq>[] = [];

  if (type) {
    conditions.push(eq(patientsTable.type, type));
  }

  let patients;
  if (search) {
    const searchCondition = or(
      ilike(patientsTable.name, `%${search}%`),
      ilike(patientsTable.phone, `%${search}%`),
      ilike(patientsTable.patientId, `%${search}%`)
    )!;
    patients = await db
      .select()
      .from(patientsTable)
      .where(conditions.length > 0 ? and(searchCondition, ...conditions) : searchCondition)
      .orderBy(patientsTable.createdAt);
  } else {
    patients = await db
      .select()
      .from(patientsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(patientsTable.createdAt);
  }

  res.json(ListPatientsResponse.parse(patients.map(serializePatient)));
});

router.post("/patients", async (req, res): Promise<void> => {
  const parsed = CreatePatientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // Insert with a temporary patientId, then update with real one
  const [patient] = await db
    .insert(patientsTable)
    .values({ ...parsed.data, patientId: "GH-TMP" })
    .returning();

  const realId = buildPatientId(patient.id);
  const [updated] = await db
    .update(patientsTable)
    .set({ patientId: realId })
    .where(eq(patientsTable.id, patient.id))
    .returning();

  res.status(201).json(GetPatientResponse.parse(serializePatient(updated)));
});

router.get("/patients/:id", async (req, res): Promise<void> => {
  const params = GetPatientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [patient] = await db
    .select()
    .from(patientsTable)
    .where(eq(patientsTable.id, params.data.id));

  if (!patient) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }

  res.json(GetPatientResponse.parse(serializePatient(patient)));
});

router.patch("/patients/:id", async (req, res): Promise<void> => {
  const params = UpdatePatientParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdatePatientBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [patient] = await db
    .update(patientsTable)
    .set(parsed.data)
    .where(eq(patientsTable.id, params.data.id))
    .returning();

  if (!patient) {
    res.status(404).json({ error: "Patient not found" });
    return;
  }

  res.json(UpdatePatientResponse.parse(serializePatient(patient)));
});

export default router;
