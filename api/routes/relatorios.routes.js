const express = require("express");
const router = express.Router();
const gerarRelatorios = require("../controllers/relatorio.controllers");

// Rota para geração de relatórios
router.get("/relatorios", gerarRelatorios.gerarRelatorios);


module.exports = router;
