const express = require('express');
const emprestimosController = require('../controllers/emprestimos.controllers');

const router = express.Router();

router.get('/emprestimos/:id', emprestimosController.show);
router.get('/emprestimos', emprestimosController.list);
//router.post('/livro', emprestimosController.create);
//router.get('/categorias', emprestimosController.listCategories);  // Adicionando a nova rota
router.put('/emprestimos/:id/devolver', emprestimosController.devolver);
router.put('/emprestimos/:id/reservar', emprestimosController.reservar);
//router.delete('/livro/:codigo', emprestimosController.destroy);

module.exports = router;
