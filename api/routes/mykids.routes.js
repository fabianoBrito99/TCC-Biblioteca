const express = require("express");
const controller = require("../controllers/mykids.controllers");
const { auth, authorize } = require("../middlewares/auth");

const router = express.Router();
const myKidsAccess = [auth, authorize("admin", "leitor+mykids")];
router.get("/public/mykids/checkins/:code", controller.getPublicCheckin);
router.get("/public/mykids/rooms", controller.getPublicRoomOccupancy);
router.post("/public/mykids/print-jobs/claim", controller.claimPrintJob);
router.post("/public/mykids/print-jobs/:id/complete", controller.completePrintJob);

router.get("/mykids/rooms", ...myKidsAccess, controller.listRooms);
router.post("/mykids/rooms", ...myKidsAccess, controller.createRoom);
router.patch("/mykids/rooms/:id", ...myKidsAccess, controller.updateRoom);
router.get("/mykids/guardians", ...myKidsAccess, controller.listGuardians);
router.post("/mykids/guardians", ...myKidsAccess, controller.createGuardian);
router.patch("/mykids/guardians/:id", ...myKidsAccess, controller.updateGuardian);
router.post("/mykids/guardians/:id/children", ...myKidsAccess, controller.createChild);
router.patch("/mykids/children/:id", ...myKidsAccess, controller.updateChild);
router.post("/mykids/checkins", ...myKidsAccess, controller.createCheckin);
router.patch("/mykids/checkins/:id/checkout", ...myKidsAccess, controller.checkoutCheckin);
router.get("/mykids/checkins/today", ...myKidsAccess, controller.listTodayCheckins);
router.get("/mykids/room-close-alerts", ...myKidsAccess, controller.roomCloseAlerts);
router.post("/mykids/rooms/:id/snooze-close", ...myKidsAccess, controller.snoozeRoomClose);
router.get("/mykids/room-history", ...myKidsAccess, controller.roomHistory);
router.get("/mykids/printer-settings", ...myKidsAccess, controller.getPrinterSettings);
router.patch("/mykids/printer-settings", ...myKidsAccess, controller.updatePrinterSettings);
router.post("/mykids/print-jobs", ...myKidsAccess, controller.createPrintJob);

module.exports = router;
