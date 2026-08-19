const express = require("express");
const router = express.Router();
const notificacoesController = require("../controllers/notificacoes.controllers");
const { auth, authorizeParamSelfOr } = require('../middlewares/auth');

router.post("/notificacoes/gerar/:idUsuario", auth, authorizeParamSelfOr("idUsuario", "admin"), notificacoesController.gerarNotificacoes);
router.get("/notificacoes/:idUsuario", auth, authorizeParamSelfOr("idUsuario", "admin"), notificacoesController.listarNotificacoes);
router.patch(
  "/notificacoes/:idNotificacao/lida",
  auth,
  notificacoesController.marcarNotificacaoLida
);

module.exports = router;
