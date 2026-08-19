const express = require("express");
const router = express.Router();
const gerarRelatorios = require("../controllers/relatorio.controllers");
const { auth, authorize } = require('../middlewares/auth');

// Rota para geração de relatórios
router.get("/relatorios", auth, authorize("admin"), gerarRelatorios.gerarRelatorios);


module.exports = router;
