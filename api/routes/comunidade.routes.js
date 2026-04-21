const express = require("express");
const comunidadeController = require("../controllers/comunidade.controllers");
const router = express.Router();
const { auth } = require("../middlewares/auth");

router.post("/comunidade", auth, comunidadeController.criarComunidade);
router.get("/comunidade", comunidadeController.listarComunidades);
router.get("/comunidade/:id", comunidadeController.obterComunidade);
router.get("/comunidade/slug/:slug", comunidadeController.obterComunidadePorSlug);
router.post("/comunidade/:id/entrar", auth, comunidadeController.entrarComunidade);
router.post("/comunidade/:idComunidade/sair", auth, comunidadeController.sairComunidade);
router.delete("/comunidade/:idComunidade", auth, comunidadeController.excluirComunidade);
router.get(
  "/comunidade/:id/comentarios",
  auth,
  comunidadeController.listarComentarios
);
router.post(
  "/comunidade/:id/comentarios",
  auth,
  comunidadeController.adicionarComentario
);
router.post(
  "/comunidade/:id/comentarios/:idComentario/visto",
  auth,
  comunidadeController.marcarComentarioVisto
);
router.get(
  "/comunidade/:id/comentarios/:idComentario/vistos",
  auth,
  comunidadeController.listarVistosComentario
);

router.post(
  "/comunidade/:id/progresso",
  auth,
  comunidadeController.registrarProgresso
);

router.get("/comunidade/:id/progresso", comunidadeController.listarProgresso);
router.get(
  "/comunidade/:id/estatisticas/idade",
  comunidadeController.estatisticasIdade
);

router.get(
  "/comunidade/usuario/:idUsuario",
  auth,
  comunidadeController.listarComunidadesUsuario
);

router.get(
  "/comunidade/:id/usuarios",
  auth,
  comunidadeController.listarUsuariosComunidade
);

router.get(
  "/comunidade/:idComunidade/participantes",
  auth,
  comunidadeController.listarParticipantes
);

router.patch(
  "/comunidade/:comunidadeId/usuarios/:idUsuario",
  auth,
  comunidadeController.atualizarStatusUsuario
);

router.patch(
  "/comunidade/:comunidadeId/usuarios/:idUsuario/nivel",
  auth,
  comunidadeController.atualizarNivelUsuario
);

router.get(
  "/comunidade/:idComunidade/usuario/:idUsuario/status",
  comunidadeController.verificarStatusUsuario
);

router.get(
  "/comunidade/:idComunidade/solicitacoes",
  auth,
  comunidadeController.listarSolicitacoes
);

router.get(
  "/comunidade/:id/verificar-admin/:userId",
  auth,
  comunidadeController.verificarAdmin
);


router.get("/comunidade/:idComunidade/objetivo-ativo", comunidadeController.verificarObjetivoAtivo);


router.post("/comunidade/objetivo", auth, comunidadeController.criarObjetivo);
router.patch("/comunidade/objetivo/:idObjetivo", auth, comunidadeController.editarObjetivo);
router.patch("/comunidade/objetivo/:idObjetivo/finalizar", auth, comunidadeController.finalizarObjetivo);

router.post("/comunidade/objetivo/progresso", auth, comunidadeController.registrarProgressoObjetivo);
router.get("/comunidade/objetivo/:id_objetivo/progresso", comunidadeController.listarProgressoObjetivo);

router.get("/comunidade/:idComunidade/objetivo-ativo2", comunidadeController.obterObjetivoAtivo);

router.post("/comunidade/:idComunidade/objetivo/progresso", auth, comunidadeController.registrarProgressoObjetivo);


router.get("/comunidade/:id/top-leitores", comunidadeController.listarTopLeitores);

router.get(
  "/comunidade/:idComunidade/usuario/:idUsuario/leitura-diaria",
  comunidadeController.leituraDiariaUsuario
);

router.get(
  "/comunidade/:idComunidade/usuario/:idUsuario/indicadores-leitura",
  comunidadeController.indicadoresLeituraUsuario
);

module.exports = router;
