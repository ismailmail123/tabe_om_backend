const express = require("express");

const router = express.Router();

const { validateToken } = require("../middlewares/auth")
const {
    index,
    updateStatus,
    createPayment,
    handleMidtransNotification
} = require("../controllers/payment.controller")

// /api/babs
router.get("/", validateToken, index);
router.put("/:order_id/status", validateToken, updateStatus);
router.post("/midtrans-notifications", handleMidtransNotification);
router.post("/:order_id/payment-by-order", validateToken, createPayment);


module.exports = router;