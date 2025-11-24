const express = require("express");

const router = express.Router();
const { upload } = require("../config/multer");

const { validateToken } = require("../middlewares/auth")
const { index, create, getOrderById, updateStatus, cancelOrder } = require("../controllers/order.controller")

// /api/babs
router.get("/", validateToken, index);
router.get("/:orderId", validateToken, getOrderById);
router.put(
    "/:orderId/status",
    validateToken,
    upload.fields([
        { name: "purchase_receipt_photo", maxCount: 1 }, // Field untuk foto struk pembelian
    ]),
    updateStatus
);
router.put("/:orderId/cancel", validateToken, cancelOrder);
router.post("/", validateToken, create);


module.exports = router;