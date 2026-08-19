const express = require("express");
const multer = require("multer");
const livrosController = require("../controllers/livros.controllers")
const { auth, authorize } = require('../middlewares/auth');
const { createRateLimit } = require("../middlewares/rateLimit");

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});
const livrosReadRateLimit = createRateLimit({
  windowMs: 60_000,
  maxRequests: 120,
  keyPrefix: "livros:lista",
});

router.get("/livro/:codigo", livrosController.show);
router.get("/livro", livrosReadRateLimit, livrosController.list);
router.post("/livro", auth, authorize("admin"), upload.single("foto_capa"), livrosController.create);
router.put("/livro/:id", auth, authorize("admin"), upload.single("foto_capa"), livrosController.update);
router.delete("/livro/:id", auth, authorize("admin"), livrosController.destroy);

router.get("/categorias", livrosController.listaCategorias);
router.post("/livro/:livroId/categoria", auth, authorize("admin"), livrosController.addCategoria);

router.get("/livro/:livroId/autores", livrosController.ListaAutorLivro);

router.get("/livro/categoria/:categoria", livrosController.sugestoesLivro);

module.exports = router;
