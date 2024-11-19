const express = require("express");
const comunidadeController = require("../controllers/comunidade.controllers");
const router = express.Router();

router.post("/comunidade", comunidadeController.criarComunidade);
router.get("/comunidade", comunidadeController.listarComunidades);
router.get("/comunidade/:id", comunidadeController.obterComunidade);
router.post("/comunidade/:id/entrar", comunidadeController.entrarComunidade);
router.get(
  "/comunidade/:id/comentarios",
  comunidadeController.listarComentarios
);
router.post(
  "/comunidade/:id/comentarios",
  comunidadeController.adicionarComentario
);

router.post("/comunidade/:id/progresso", comunidadeController.registrarProgresso);

router.get("/comunidade/:id/progresso", comunidadeController.listarProgresso);
router.get("/comunidade/:id/estatisticas/idade", comunidadeController.estatisticasIdade);

module.exports = router;
