const express = require("express");

const router = express.Router();
// const { storage } = require("../storage/storage");
// const multer = require("multer");

const { upload } = require("../config/multer");

const { validateToken } = require("../middlewares/auth")
const { index, show, create, remove, update, updateAvailability } = require("../controllers/product.controller")

// /api/babs
router.get("/", validateToken, index);
router.get("/:id", validateToken, show);
router.post("/", validateToken, upload.single("img_url"), create);
router.delete("/:productId/delete", validateToken, remove);
router.put("/update", validateToken, updateAvailability);
router.put("/:productId", validateToken, upload.single("img_url"), update);

module.exports = router;