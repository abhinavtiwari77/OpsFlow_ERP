import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middleware/auth";
import { login, me } from "../controllers/auth.controller";

const router = Router();

router.post("/login", asyncHandler(login));
router.get("/me", requireAuth, asyncHandler(me));

export default router;
