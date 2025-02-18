const express = require("express");
const router = express.Router();
const indicacoesController = require("../controllers/indicacoes.controllers");

router.get("/indicacoes", indicacoesController.listarIndicacoes);
router.get("/livros/busca", indicacoesController.buscarLivros);
router.post("/indicacoes", indicacoesController.adicionarIndicacao);
router.delete("/indicacoes/:id_indicacao", indicacoesController.excluirIndicacao);


module.exports = router;