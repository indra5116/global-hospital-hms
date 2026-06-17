import { Router, type IRouter } from "express";
import healthRouter from "./health";
import patientsRouter from "./patients";
import appointmentsRouter from "./appointments";
import labRouter from "./lab";
import pharmacyRouter from "./pharmacy";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(patientsRouter);
router.use(appointmentsRouter);
router.use(labRouter);
router.use(pharmacyRouter);
router.use(dashboardRouter);

export default router;
