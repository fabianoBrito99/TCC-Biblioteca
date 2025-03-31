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


router.get("/comunidade/:idComunidade/objetivo-ativo", comunidadeController.verificarObjetivoAtivo);


router.post("/comunidade/objetivo", comunidadeController.criarObjetivo);

router.post("/comunidade/objetivo/progresso", comunidadeController.registrarProgressoObjetivo);
router.get("/comunidade/objetivo/:id_objetivo/progresso", comunidadeController.listarProgressoObjetivo);

router.get("/comunidade/:idComunidade/objetivo-ativo2", comunidadeController.obterObjetivoAtivo);

router.post("/comunidade/:idComunidade/objetivo/progresso", comunidadeController.registrarProgressoObjetivo);



module.exports = router;
