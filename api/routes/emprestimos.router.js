const express = require('express');
const emprestimosController = require('../controllers/emprestimos.controllers');
const { auth, authorize, authorizeParamSelfOr } = require('../middlewares/auth');
const router = express.Router();

router.get('/emprestimos', auth, authorize('admin'), emprestimosController.list);
router.get('/emprestimos/aprovar', auth, authorize('admin'), emprestimosController.emprestimoAprovar);


router.get('/emprestimos/:id', auth, emprestimosController.show);
router.put('/emprestimos/:id/reservar', auth, emprestimosController.reservar);
router.put('/emprestimos/:id/aprovar', auth, authorize('admin'), emprestimosController.aprovarReserva);
router.put('/emprestimos/:id/rejeitar', auth, authorize('admin'), emprestimosController.rejeitarReserva);
router.put('/emprestimos/:id/devolver', auth, authorize('admin'), emprestimosController.devolver);

router.get("/historico/:idUsuario", auth, authorizeParamSelfOr('idUsuario', 'admin'), emprestimosController.listarHistorico);

module.exports = router;
