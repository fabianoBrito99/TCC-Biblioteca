const express = require('express');
const comentarioController = require('../controllers/comentario.controller');
const router = express.Router();
const { authorize } = require('../middlewares/auth');
// Criar comentário
router.post('/comentario', comentarioController.criarComentario);

// Listar comentários por livro
router.get('/livro/:idLivro/comentarios', comentarioController.listarComentariosPorLivro);

// Curtir comentário
router.post('/comentario/curtir', comentarioController.curtirComentario);

// Responder a comentário
router.post('/comentario/responder', comentarioController.responderComentario);

module.exports = router;
