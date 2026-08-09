import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { getDashboardStats } from "../controllers/stats.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();
router.use(requireAuth);

router.get("/", asyncHandler(getDashboardStats));

export default router;
