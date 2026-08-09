import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  createCustomer,
  listCustomers,
  getCustomer,
  updateCustomer,
  addFollowUpNote,
} from "../controllers/customer.controller";

const router = Router();

router.use(requireAuth);

// Admin and Sales manage customers. Everyone authenticated can view.
router.post("/", requireRole("ADMIN", "SALES"), asyncHandler(createCustomer));
router.get("/", asyncHandler(listCustomers));
router.get("/:id", asyncHandler(getCustomer));
router.put("/:id", requireRole("ADMIN", "SALES"), asyncHandler(updateCustomer));
router.post("/:id/notes", requireRole("ADMIN", "SALES"), asyncHandler(addFollowUpNote));

export default router;
