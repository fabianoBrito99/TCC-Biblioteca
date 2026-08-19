const express = require("express");
const multer = require("multer");
const ocrController = require("../controllers/ocr.controllers");
const { auth } = require("../middlewares/auth");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

router.post("/ocr", auth, (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({ error: "Imagem muito grande. Limite de 10MB." });
      }
      return res.status(400).json({ error: "Falha no upload da imagem." });
    }
    return next();
  });
}, ocrController.ocrImage);

module.exports = router;
