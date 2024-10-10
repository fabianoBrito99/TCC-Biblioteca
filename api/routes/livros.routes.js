const express = require('express');
const multer = require('multer');
const livrosController = require('../controllers/livros.controllers');

const router = express.Router();

// Configuração do multer para o upload de arquivos em memória
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Rotas para livros
router.get('/livro/:codigo', livrosController.show);

router.get('/livro', livrosController.list);
router.get('/pesquisar', livrosController.pesquisarLivros);

router.post('/livro', upload.single('imagem_capa'), livrosController.create);

// Rota para listar categorias
router.get('/categorias', livrosController.listCategories);

module.exports = router;
