const express = require("express");

const router = express.Router();

const { upload } = require("../config/multer");

const { validateToken } = require("../middlewares/auth")
const {
    index,
    show,
    create,
    update,
    remove
} = require("../controllers/variant.controller")

// /api/babs
router.get("/", validateToken, index);
// router.get("/seller", validateToken, indexSeller);
// router.get("/desc", showDesc);
router.get("/:id", validateToken, show);
router.post("/", validateToken, upload.single("img_url"), create);
router.delete("/delete", validateToken, remove);
router.put("/:variantId", validateToken, upload.single("img_url"), update);


module.exports = router;