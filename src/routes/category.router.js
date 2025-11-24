const express = require("express");

const router = express.Router();

const { validateToken } = require("../middlewares/auth")
const {
    index,
    show,
    create,
    update,
    remove
} = require("../controllers/category.controller")

// /api/babs
router.get("/", validateToken, index);
router.get("/:id", validateToken, show);
router.post("/", validateToken, create);
router.delete("/delete", validateToken, remove);
router.put("/:id", validateToken, update);


module.exports = router;