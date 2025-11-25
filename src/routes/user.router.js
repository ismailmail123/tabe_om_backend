const express = require("express");

const router = express.Router();

const { upload } = require("../config/multer");

const { validateToken } = require("../middlewares/auth.js");
const { indexUser, show, updateUser, remove } = require("../controllers/user.controller.js");


router.get("/", validateToken, indexUser);
router.get("/:id", validateToken, show);
router.put("/:userId", validateToken, upload.single("photo"), updateUser);
router.delete("/delete", validateToken, remove);

module.exports = router;