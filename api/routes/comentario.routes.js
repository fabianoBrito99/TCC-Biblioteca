const express = require('express');
const comentarioController = require('../controllers/comentario.controller');
const router = express.Router();
const { auth } = require('../middlewares/auth');
// Criar comentário
router.post('/comentario', auth, comentarioController.criarComentario);

// Listar comentários por livro
router.get('/livro/:idLivro/comentarios', comentarioController.listarComentariosPorLivro);

// Curtir comentário
router.post('/comentario/curtir', auth, comentarioController.curtirComentario);

// Responder a comentário
router.post('/comentario/responder', auth, comentarioController.responderComentario);

module.exports = router;
