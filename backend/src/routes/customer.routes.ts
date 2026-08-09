import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import {
  createCustomer,
  listCustomers,
  getCustomer,
  updateCustomer,
  addFollowUpNote,
  deleteCustomer
} from "../controllers/customer.controller";

const router = Router();

router.use(requireAuth);

router.post("/", requirePermission("customers", "create"), asyncHandler(createCustomer));
router.get("/", requirePermission("customers", "list"), asyncHandler(listCustomers));
router.get("/:id", requirePermission("customers", "read"), asyncHandler(getCustomer));
router.put("/:id", requirePermission("customers", "update"), asyncHandler(updateCustomer));
router.delete("/:id", requirePermission("customers", "delete"), asyncHandler(deleteCustomer));
router.post("/:id/notes", requirePermission("customers", "update"), asyncHandler(addFollowUpNote));

export default router;
