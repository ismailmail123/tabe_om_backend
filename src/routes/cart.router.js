const express = require("express");

const router = express.Router();

const { validateToken } = require("../middlewares/auth")
const { index, create, remove, update } = require("../controllers/cart.controller")

// /api/babs
router.get("/", validateToken, index);
router.post("/", validateToken, create);
router.delete("/:id", validateToken, remove);
router.put("/:id", validateToken, update);


module.exports = router;