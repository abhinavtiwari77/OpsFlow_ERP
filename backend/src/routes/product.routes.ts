import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth, requirePermission } from "../middleware/auth";
import {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  recordStockMovement,
  deleteProduct
} from "../controllers/product.controller";

const router = Router();

router.use(requireAuth);

router.post("/", requirePermission("products", "create"), asyncHandler(createProduct));
router.get("/", requirePermission("products", "list"), asyncHandler(listProducts));
router.get("/:id", requirePermission("products", "read"), asyncHandler(getProduct));
router.put("/:id", requirePermission("products", "update"), asyncHandler(updateProduct));
router.delete("/:id", requirePermission("products", "delete"), asyncHandler(deleteProduct));
router.post("/:id/stock-movement", requirePermission("stockMovements", "create"), asyncHandler(recordStockMovement));

export default router;
