const express = require("express");
const controller = require("../controllers/mykids.controllers");
const { auth, authorize } = require("../middlewares/auth");

const router = express.Router();
const adminOnly = [auth, authorize("admin")];
const trustedAdminBridge = (req, _res, next) => { req.trustedAdminBridge = true; next(); };

router.get("/public/mykids/checkins/:code", controller.getPublicCheckin);
router.post("/public/mykids/print-jobs/claim", controller.claimPrintJob);
router.post("/public/mykids/print-jobs/:id/complete", controller.completePrintJob);

router.get("/mykids/rooms", ...adminOnly, controller.listRooms);
router.post("/mykids/rooms", ...adminOnly, controller.createRoom);
router.patch("/mykids/rooms/:id", ...adminOnly, controller.updateRoom);
router.get("/mykids/guardians", ...adminOnly, controller.listGuardians);
router.post("/mykids/guardians", ...adminOnly, controller.createGuardian);
router.patch("/mykids/guardians/:id", ...adminOnly, controller.updateGuardian);
router.patch("/mykids/children/:id", ...adminOnly, controller.updateChild);
router.post("/mykids/checkins", ...adminOnly, controller.createCheckin);
router.patch("/mykids/checkins/:id/checkout", ...adminOnly, controller.checkoutCheckin);
router.get("/mykids/checkins/today", ...adminOnly, controller.listTodayCheckins);
router.get("/mykids/printer-settings", ...adminOnly, controller.getPrinterSettings);
router.patch("/mykids/printer-settings", ...adminOnly, controller.updatePrinterSettings);
router.post("/mykids/print-jobs", ...adminOnly, controller.createPrintJob);
router.post("/mykids/print-jobs/claim", ...adminOnly, trustedAdminBridge, controller.claimPrintJob);
router.post("/mykids/print-jobs/:id/complete", ...adminOnly, trustedAdminBridge, controller.completePrintJob);

module.exports = router;
