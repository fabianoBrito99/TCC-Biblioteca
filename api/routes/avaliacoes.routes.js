const express = require('express');
const avaliacaoController = require('../controllers/avaliacoes.controllers');
const router = express.Router();

// Rota para listar as avaliações de um livro
router.get("/livro/:livroId/avaliacoes", avaliacaoController.listaAvaliacoes);

// Rota para adicionar uma nova avaliação
router.post("/livro/:livroId/avaliacao", avaliacaoController.adicionaAvaliacao);

module.exports = router;
