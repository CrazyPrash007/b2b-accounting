// src/routes/payment.routes.js
const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const auth = require("../middlewares/auth");

router.get("/", auth, paymentController.list);
router.get("/:id", auth, paymentController.getOne);
router.post("/", auth, paymentController.create);
router.put("/:id", auth, paymentController.update);
router.delete("/:id", auth, paymentController.remove);

module.exports = router;
