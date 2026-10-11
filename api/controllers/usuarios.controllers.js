const connection = require("../config/mysql.config");


const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const query = (executor, sql, params = []) =>
  new Promise((resolve, reject) =>
    executor.query(sql, params, (error, rows) =>
      error ? reject(error) : resolve(rows)
    )
  );
const getConnection = () =>
  new Promise((resolve, reject) =>
    connection.getConnection((error, dbConnection) =>
      error ? reject(error) : resolve(dbConnection)
    )
  );
const begin = (dbConnection) =>
  new Promise((resolve, reject) =>
    dbConnection.beginTransaction((error) =>
      error ? reject(error) : resolve()
    )
  );
const commit = (dbConnection) =>
  new Promise((resolve, reject) =>
    dbConnection.commit((error) => (error ? reject(error) : resolve()))
  );
const rollback = (dbConnection) =>
  new Promise((resolve) => dbConnection.rollback(resolve));

const cleanText = (value, maxLength) => {
  if (value === undefined || value === null) return "";
  return String(value).trim().replace(/\s+/g, " ").slice(0, maxLength);
};

const normalizePhone = (value) => {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!/^\d{2}9\d{8}$/.test(digits)) return null;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 3)} ${digits.slice(
    3,
    7
  )}-${digits.slice(7)}`;
};

const normalizeGender = (value) => {
  const normalized = cleanText(value, 20).toLowerCase();
  if (["m", "masculino"].includes(normalized)) return "M";
  if (["f", "feminino"].includes(normalized)) return "F";
  return null;
};

const normalizeBoolean = (value) =>
  value === true || value === 1 || value === "1" || value === "true" ? 1 : 0;

function parseProfilePhoto(value) {
  if (!value) return null;
  if (typeof value !== "string") {
    const error = new Error("Formato da foto de perfil invalido");
    error.status = 400;
    throw error;
  }

  const match = value.match(
    /^data:image\/(?:jpeg|jpg|png|webp);base64,([A-Za-z0-9+/=\s]+)$/i
  );
  if (!match) {
    const error = new Error("Formato da foto de perfil invalido");
    error.status = 400;
    throw error;
  }

  const photo = Buffer.from(match[1].replace(/\s/g, ""), "base64");
  if (!photo.length || photo.length > 2 * 1024 * 1024) {
    const error = new Error("A foto de perfil deve ter no maximo 2 MB");
    error.status = 400;
    throw error;
  }
  return photo;
}

const senhaForte = (s) =>
  typeof s === "string" &&
  s.length >= 8 && s.length <= 64 &&
  /[a-z]/.test(s) &&    // minúscula
  /[A-Z]/.test(s) &&    // maiúscula
  /[0-9]/.test(s) &&    // dígito
  /[^A-Za-z0-9]/.test(s); // caractere especial

function emitirToken(u) {
  return jwt.sign(
    { id: u.id_usuario, nome_login: u.nome_login, tipo_usuario: u.tipo_usuario || "leitor" },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES || "1d" }
  );
}


async function list(request, response) {
  connection.query(
    `SELECT id_usuario, nome_login, email, tipo_usuario, foto_usuario FROM Usuario`,
    function (err, resultado) {
      if (err) {
        return response.status(500).json({ erro: "Erro ao buscar os usuários" });
      }

      // Converte apenas a coluna `foto_usuario` em Base64, se existir
      const usuarios = resultado.map((usuario) => ({
        ...usuario,
        foto_usuario: usuario.foto_usuario
          ? Buffer.from(usuario.foto_usuario).toString("base64")
          : null,
      }));

      return response.json({ dados: usuarios });
    }
  );
}

async function show(request, response) {
  const userId = request.params.id;

  // Obter informações do usuário
  connection.query(
    `SELECT id_usuario, nome_login, email, telefone, data_nascimento, igreja_local, foto_usuario, tipo_usuario, sexo
     FROM Usuario
     WHERE id_usuario = ?`,
    [userId],
    function (err, usuario) {
      if (err) {
        return response.status(500).json({ erro: "Erro ao buscar o usuário" });
      }
      if (usuario.length === 0) {
        return response.status(404).json({ erro: "Usuário não encontrado" });
      }

      // Converte `foto_usuario` para base64, se houver uma imagem
      let fotoUsuarioBase64 = null;
      if (usuario[0].foto_usuario) {
        fotoUsuarioBase64 = Buffer.from(usuario[0].foto_usuario).toString(
          "base64"
        );
      }

      // Obter endereço do usuário
      connection.query(
        `SELECT e.* FROM Endereco e
         JOIN Usuario_Endereco ue ON e.id_endereco = ue.fk_id_endereco
         WHERE ue.fk_id_usuario = ?`,
        [userId],
        function (err, endereco) {
          if (err) {
            return response
              .status(500)
              .json({ erro: "Erro ao buscar o endereço" });
          }

          // Obter histórico de empréstimos do usuário
          connection.query(
            `SELECT e.id_emprestimo, l.nome_livro, e.data_emprestimo, e.data_devolucao
             FROM Emprestimos e
             JOIN Usuario_Emprestimos ue ON e.id_emprestimo = ue.fk_id_emprestimo
             JOIN Livro l ON e.fk_id_livros = l.id_livro
             WHERE ue.fk_id_usuario = ?`,
            [userId],
            function (err, historico) {
              if (err) {
                return response.status(500).json({
                  erro: "Erro ao buscar o histórico de empréstimos",
                });
              }

              // Respondendo com os dados completos do usuário, endereço, histórico e imagem convertida
              return response.json({
                usuario: {
                  ...usuario[0],
                  foto_usuario: fotoUsuarioBase64, // Enviando a imagem convertida em base64
                },
                endereco: endereco[0] || {},
                historico: historico,
              });
            }
          );
        }
      );
      
    }
  );
}




async function create(request, response) {
  const nomeLogin = cleanText(request.body.nome_login, 255);
  const email = cleanText(request.body.email, 254).toLowerCase();
  const senha = typeof request.body.senha === "string" ? request.body.senha : "";
  const telefone = normalizePhone(request.body.telefone);
  const dataNascimento = cleanText(request.body.data_nascimento, 10);
  const cep = cleanText(request.body.cep, 15);
  const rua = cleanText(request.body.rua, 160);
  const numero = cleanText(request.body.numero, 30);
  const bairro = cleanText(request.body.bairro, 120);
  const cidade = cleanText(request.body.cidade, 120);
  const estado = cleanText(request.body.estado, 30);
  const sexo = normalizeGender(request.body.sexo);

  if (!nomeLogin || !email || !dataNascimento || !cep || !rua || !numero || !bairro || !cidade || !estado || !sexo) {
    return response.status(400).json({ erro: "Preencha todos os campos obrigatorios do cadastro" });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return response.status(400).json({ erro: "Informe um e-mail valido" });
  }
  if (!telefone) {
    return response.status(400).json({ erro: "Informe o telefone no formato (DDD) 9 1234-5678" });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataNascimento)) {
    return response.status(400).json({ erro: "Informe uma data de nascimento valida" });
  }
  if (!senhaForte(senha)) {
    return response.status(400).json({
      erro: "Senha fraca. Use 8 a 64 caracteres com minusculas, maiusculas, numeros e especiais.",
    });
  }

  let fotoBuffer;
  try {
    fotoBuffer = parseProfilePhoto(request.body.foto_usuario);
  } catch (error) {
    return response.status(error.status || 400).json({ erro: error.message });
  }

  let dbConnection;
  try {
    const saltRounds = Number(process.env.BCRYPT_ROUNDS || 10);
    const hash = await bcrypt.hash(senha, saltRounds);
    dbConnection = await getConnection();
    await begin(dbConnection);

    const [existingUser] = await query(
      dbConnection,
      "SELECT id_usuario FROM Usuario WHERE LOWER(TRIM(email)) = ? LIMIT 1 FOR UPDATE",
      [email]
    );
    if (existingUser) {
      const error = new Error("Este e-mail ja esta cadastrado");
      error.status = 409;
      throw error;
    }

    const tipo = "leitor";
    const resultadoUsuario = await query(
      dbConnection,
      `INSERT INTO Usuario
       (nome_login, email, senha, telefone, data_nascimento, igreja_local, foto_usuario, tipo_usuario, sexo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        nomeLogin,
        email,
        hash,
        telefone,
        dataNascimento,
        normalizeBoolean(request.body.igreja_local),
        fotoBuffer,
        tipo,
        sexo,
      ]
    );

    const resultadoEndereco = await query(
      dbConnection,
      `INSERT INTO Endereco (cep, rua, numero, bairro, cidade, estado)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [cep, rua, numero, bairro, cidade, estado]
    );

    await query(
      dbConnection,
      `INSERT INTO Usuario_Endereco (fk_id_usuario, fk_id_endereco)
       VALUES (?, ?)`,
      [resultadoUsuario.insertId, resultadoEndereco.insertId]
    );

    await commit(dbConnection);
    const usuarioCriado = {
      id_usuario: resultadoUsuario.insertId,
      nome_login: nomeLogin,
      tipo_usuario: tipo,
    };
    return response.status(201).json({
      message: "Usuario criado com sucesso",
      token: emitirToken(usuarioCriado),
      usuario: usuarioCriado,
    });
  } catch (error) {
    if (dbConnection) await rollback(dbConnection);
    console.error("Erro ao criar usuario:", error);
    if (error.status) return response.status(error.status).json({ erro: error.message });
    if (error.code === "ER_DUP_ENTRY") {
      return response.status(409).json({ erro: "Este e-mail ja esta cadastrado" });
    }
    if (error.code === "ER_DATA_TOO_LONG" || error.code === "WARN_DATA_TRUNCATED") {
      return response.status(400).json({ erro: "Um dos campos ultrapassou o tamanho permitido" });
    }
    return response.status(500).json({ erro: "Nao foi possivel concluir o cadastro" });
  } finally {
    if (dbConnection) dbConnection.release();
  }
}


// API de login
async function login(request, response) {
  const identificador = cleanText(request.body.email, 254);
  const senha = typeof request.body.senha === "string" ? request.body.senha : "";

  if (!identificador || !senha) {
    return response.status(400).json({ erro: "Informe seu usuário/e-mail e sua senha" });
  }

  try {
    const usuarios = await query(
      connection,
      `SELECT id_usuario, nome_login, senha, tipo_usuario
       FROM Usuario
       WHERE email = ? OR nome_login = ?
       LIMIT 1`,
      [identificador, identificador]
    );
    const usuario = usuarios[0];
    if (!usuario) {
      return response.status(401).json({ erro: "Usuário/e-mail ou senha incorretos" });
    }

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
    if (!senhaCorreta) {
      return response.status(401).json({ erro: "Usuário/e-mail ou senha incorretos" });
    }

    return response.status(200).json({
      message: "Login bem-sucedido",
      token: emitirToken(usuario),
      usuario: {
        id_usuario: usuario.id_usuario,
        nome_login: usuario.nome_login,
        tipo_usuario: usuario.tipo_usuario,
      },
    });
  } catch (error) {
    console.error("Erro ao autenticar usuário:", error);
    return response.status(500).json({
      erro: "Não foi possível entrar agora. Tente novamente em instantes.",
    });
  }
}

async function atualizarTipoUsuario(req, res) {
  const userId = Number(req.params.id);
  const requestedType = String(req.body.tipo_usuario || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  const aliases = new Map([
    ["administrador", "admin"],
    ["admin", "admin"],
    ["voluntario", "voluntario"],
    ["leitor", "leitor"],
    ["leitor+mykids", "leitor+mykids"],
    ["leitor_mykids", "leitor+mykids"],
    ["leitor-mykids", "leitor+mykids"],
  ]);
  const userType = aliases.get(requestedType);

  if (!Number.isInteger(userId) || userId <= 0) {
    return res.status(400).json({ erro: "Usuário inválido" });
  }
  if (!userType) {
    return res.status(400).json({ erro: "Tipo de usuário inválido" });
  }

  try {
    const usuarios = await query(
      connection,
      "SELECT id_usuario FROM Usuario WHERE id_usuario = ? LIMIT 1",
      [userId]
    );
    if (!usuarios[0]) {
      return res.status(404).json({ erro: "Usuário não encontrado" });
    }

    await query(
      connection,
      "UPDATE Usuario SET tipo_usuario = ? WHERE id_usuario = ?",
      [userType, userId]
    );
    return res.status(200).json({
      message: "Tipo de usuário atualizado com sucesso",
      usuario: { id_usuario: userId, tipo_usuario: userType },
    });
  } catch (error) {
    console.error("Erro ao atualizar tipo de usuário:", error);
    return res.status(500).json({
      erro: "Não foi possível atualizar o tipo de usuário agora",
    });
  }
}


module.exports = { list, show, login, create, atualizarTipoUsuario,};
