const express = require("express");
const multer = require("multer");
const ocrController = require("../controllers/ocr.controllers");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 6 * 1024 * 1024 },
});

router.post("/ocr", upload.single("image"), ocrController.ocrImage);

module.exports = router;
