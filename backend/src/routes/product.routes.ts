import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, requireRole } from "../middleware/auth";
import {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  recordStockMovement,
} from "../controllers/product.controller";

const router = Router();

router.use(requireAuth);

// Admin and Warehouse manage products/stock. Everyone authenticated can view.
router.post("/", requireRole("ADMIN", "WAREHOUSE"), asyncHandler(createProduct));
router.get("/", asyncHandler(listProducts));
router.get("/:id", asyncHandler(getProduct));
router.put("/:id", requireRole("ADMIN", "WAREHOUSE"), asyncHandler(updateProduct));
router.post("/:id/stock-movement", requireRole("ADMIN", "WAREHOUSE"), asyncHandler(recordStockMovement));

export default router;
