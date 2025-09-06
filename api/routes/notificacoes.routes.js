const express = require("express");
const router = express.Router();
const notificacoesController = require("../controllers/notificacoes.controllers");
const { auth, authorize } = require('../middlewares/auth');

router.post("/notificacoes/gerar/:idUsuario", notificacoesController.gerarNotificacoes);
router.get("/notificacoes/:idUsuario", notificacoesController.listarNotificacoes);
router.patch(
  "/notificacoes/:idNotificacao/lida",
  notificacoesController.marcarNotificacaoLida
);

module.exports = router;
