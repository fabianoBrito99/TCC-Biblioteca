const express = require('express');
const usuariosController =require('../controllers/usuarios.controllers');

const router = express.Router();

router.get('/usuario/:id', usuariosController.show);
router.get('/usuario', usuariosController.list);
router.post('/usuario', usuariosController.create);
//router.put('/usuario/:codigo', usuariosController.update);
//router.delete('/usuario/:codigo', usuariosController.destroy);
router.post('/login', usuariosController.login); 
module.exports = router;