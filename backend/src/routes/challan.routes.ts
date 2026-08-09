import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  createChallan,
  listChallans,
  getChallan,
  confirmChallan,
  cancelChallan,
} from "../controllers/challan.controller";

const router = Router();

router.use(requireAuth);

// Sales and Admin create/confirm challans. Warehouse and Accounts can view.
router.post("/", requireRole("ADMIN", "SALES"), asyncHandler(createChallan));
router.get("/", asyncHandler(listChallans));
router.get("/:id", asyncHandler(getChallan));
router.post("/:id/confirm", requireRole("ADMIN", "SALES"), asyncHandler(confirmChallan));
router.post("/:id/cancel", requireRole("ADMIN", "SALES"), asyncHandler(cancelChallan));

export default router;
