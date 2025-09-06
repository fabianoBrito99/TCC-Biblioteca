const express = require('express');
const doelivroController = require('../controllers/doelivro.controllers');
const router = express.Router();
const { auth, authorize } = require('../middlewares/auth');
router.get("/sugestoes", doelivroController.listarSugestoes);

// Rota para adicionar uma nova sugestão
router.post("/sugestoes", doelivroController.adicionarSugestao);

module.exports = router;