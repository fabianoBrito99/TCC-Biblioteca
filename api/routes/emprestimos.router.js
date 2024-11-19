const express = require('express');
const emprestimosController = require('../controllers/emprestimos.controllers');

const router = express.Router();

router.get('/emprestimos', emprestimosController.list);
router.get('/emprestimos/aprovar', emprestimosController.emprestimoAprovar);


router.get('/emprestimos/:id', emprestimosController.show);
router.put('/emprestimos/:id/reservar', emprestimosController.reservar);
router.put('/emprestimos/:id/aprovar', emprestimosController.aprovarReserva);
router.put('/emprestimos/:id/rejeitar', emprestimosController.rejeitarReserva);
router.put('/emprestimos/:id/devolver', emprestimosController.devolver);

module.exports = router;
