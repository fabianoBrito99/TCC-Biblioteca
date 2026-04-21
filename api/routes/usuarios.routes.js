// const express = require('express');
// const usuariosController =require('../controllers/usuarios.controllers');

// const router = express.Router();

// router.get('/usuario/:id', usuariosController.show);
// router.get('/usuario', usuariosController.list);
// router.post('/usuario', usuariosController.create);
// //router.put('/usuario/:codigo', usuariosController.update);
// //router.delete('/usuario/:codigo', usuariosController.destroy);
// router.post('/login', usuariosController.login); 
// router.patch("/usuario/:id/tipo", usuariosController.atualizarTipoUsuario);

// module.exports = router;


const express = require('express');
const usuariosController = require('../controllers/usuarios.controllers');
const { auth, authorize, authorizeSelfOr } = require('../middlewares/auth');

const router = express.Router();

// protegidas
// leitor só pode consultar o próprio usuário; admin pode consultar qualquer um
router.get('/usuario/:id', auth, authorizeSelfOr('admin'), usuariosController.show);
// listagem completa de usuários: somente admin
router.get('/usuario', auth, authorize('admin'), usuariosController.list);

// públicas
router.post('/usuario', usuariosController.create);
router.post('/login', usuariosController.login);

// alteração de perfil de usuário: somente admin
router.patch("/usuario/:id/tipo", auth, authorize('admin'), usuariosController.atualizarTipoUsuario);

module.exports = router;
