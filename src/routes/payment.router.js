// const express = require("express");

// const router = express.Router();

// const { validateToken } = require("../middlewares/auth")
// const {
//     index,
//     updateStatus,
//     createPayment,
//     handleMidtransNotification
// } = require("../controllers/payment.controller")

// // /api/babs
// router.get("/", validateToken, index);
// router.put("/:order_id/status", validateToken, updateStatus);
// router.post("/midtrans-notifications", handleMidtransNotification);
// router.post("/:order_id/payment-by-order", validateToken, createPayment);


// module.exports = router;

const express = require("express");
const router = express.Router();
const { upload } = require("../config/multer"); // Import multer config

const { validateToken } = require("../middlewares/auth")
const {
    index,
    updateStatus,
    verifyPayment,
    createPayment,
    handleMidtransNotification
} = require("../controllers/payment.controller")

// /api/payments
router.get("/", validateToken, index);

// Route untuk update status dengan atau tanpa upload bukti pembayaran
router.put(
    "/:order_id/status",
    validateToken,
    upload.fields([{
        name: "proof_of_payment",
        maxCount: 1
    }]),
    updateStatus
);
router.put("/payment_verify", validateToken, verifyPayment);
router.post("/midtrans-notifications", handleMidtransNotification);
router.post("/:order_id/payment-by-order", validateToken, upload.fields([{
    name: "proof_of_payment",
    maxCount: 1
}]), createPayment);

module.exports = router;