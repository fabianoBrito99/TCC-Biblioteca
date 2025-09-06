const express = require("express");
const router = express.Router();
const sugestoesController = require("../controllers/sugestoes.controllers");
const { auth, authorize } = require('../middlewares/auth');

router.get("/sugestoes/categorias",  sugestoesController.listarCategorias);
router.get("/sugestoes/autores",  sugestoesController.listarAutores);
router.get("/sugestoes/editoras",  sugestoesController.listarEditoras);

module.exports = router;
