const express = require("express");
const controller = require("../controllers/mykids.controllers");
const { auth, authorize } = require("../middlewares/auth");

const router = express.Router();
const adminOnly = [auth, authorize("admin")];

router.get("/public/mykids/checkins/:code", controller.getPublicCheckin);

router.get("/mykids/rooms", ...adminOnly, controller.listRooms);
router.post("/mykids/rooms", ...adminOnly, controller.createRoom);
router.patch("/mykids/rooms/:id", ...adminOnly, controller.updateRoom);
router.get("/mykids/guardians", ...adminOnly, controller.listGuardians);
router.post("/mykids/guardians", ...adminOnly, controller.createGuardian);
router.post("/mykids/checkins", ...adminOnly, controller.createCheckin);
router.patch("/mykids/checkins/:id/checkout", ...adminOnly, controller.checkoutCheckin);
router.get("/mykids/checkins/today", ...adminOnly, controller.listTodayCheckins);
router.get("/mykids/printer-settings", ...adminOnly, controller.getPrinterSettings);
router.patch("/mykids/printer-settings", ...adminOnly, controller.updatePrinterSettings);

module.exports = router;
