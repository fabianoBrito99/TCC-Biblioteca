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

router.post(
  "/comunidade/:id/progresso",
  comunidadeController.registrarProgresso
);

router.get("/comunidade/:id/progresso", comunidadeController.listarProgresso);
router.get(
  "/comunidade/:id/estatisticas/idade",
  comunidadeController.estatisticasIdade
);

router.get(
  "/comunidade/usuario/:idUsuario",
  comunidadeController.listarComunidadesUsuario
);

router.get(
  "/comunidade/:id/usuarios",
  comunidadeController.listarUsuariosComunidade
);

router.patch(
  "/comunidade/:comunidadeId/usuarios/:idUsuario",
  comunidadeController.atualizarStatusUsuario
);

router.get(
  "/comunidade/:idComunidade/usuario/:idUsuario/status",
  comunidadeController.verificarStatusUsuario
);

router.get(
  "/comunidade/:idComunidade/solicitacoes",
  comunidadeController.listarSolicitacoes
);

router.get(
  "/comunidade/:id/verificar-admin/:userId",
  comunidadeController.verificarAdmin
);

module.exports = router;
