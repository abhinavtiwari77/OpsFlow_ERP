import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import {
  createChallan,
  listChallans,
  getChallan,
  confirmChallan,
  cancelChallan,
  exportPdf,
} from "../controllers/challan.controller";

const router = Router();

router.use(requireAuth);

router.post("/", requirePermission("salesChallans", "create"), asyncHandler(createChallan));
router.get("/", requirePermission("salesChallans", "list"), asyncHandler(listChallans));
router.get("/:id", requirePermission("salesChallans", "read"), asyncHandler(getChallan));
router.get("/:id/pdf", requirePermission("salesChallans", "read"), asyncHandler(exportPdf));
router.post("/:id/confirm", requirePermission("salesChallans", "confirm"), asyncHandler(confirmChallan));
router.post("/:id/cancel", requirePermission("salesChallans", "cancel"), asyncHandler(cancelChallan));

export default router;
