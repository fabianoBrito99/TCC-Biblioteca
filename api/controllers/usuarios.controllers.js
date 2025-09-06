const connection = require("../config/mysql.config");


const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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
    `SELECT * FROM Usuario WHERE id_usuario = ?`,
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
  try {
    const {
      nome_login, email, senha, telefone, igreja_local, data_nascimento,
      foto_usuario, tipo_usuario, cep, rua, numero, bairro, cidade, estado, sexo
    } = request.body;

    if (!senhaForte(senha)) {
      return response.status(400).json({
        erro: "Senha fraca. Use 8–64 chars com minúsculas, MAIÚSCULAS, números e especiais."
      });
    }

    const saltRounds = Number(process.env.BCRYPT_ROUNDS || 10);
    const hash = await bcrypt.hash(senha, saltRounds);

    const fotoBuffer = foto_usuario ? Buffer.from(foto_usuario.split(",")[1], "base64") : null;
    const sexoNormalizado = sexo === "Masculino" ? "M" : sexo === "Feminino" ? "F" : null;
    const tipo = tipo_usuario || "leitor";

    connection.query(
      `INSERT INTO Usuario (nome_login, email, senha, telefone, data_nascimento, igreja_local, foto_usuario, tipo_usuario, sexo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [nome_login, email, hash, telefone, data_nascimento, igreja_local, fotoBuffer, tipo, sexoNormalizado],
      function (err, resultadoUsuario) {
        if (err) {
          console.error("Erro ao criar usuário:", err);
          return response.status(500).json({ erro: "Erro ao criar usuário" });
        }

        connection.query(
          `INSERT INTO Endereco (cep, rua, numero, bairro, cidade, estado) VALUES (?, ?, ?, ?, ?, ?)`,
          [cep, rua, numero, bairro, cidade, estado],
          function (err, resultadoEndereco) {
            if (err) {
              console.error("Erro ao inserir endereço:", err);
              return response.status(500).json({ erro: "Erro ao inserir endereço" });
            }

            connection.query(
              `INSERT INTO Usuario_Endereco (fk_id_usuario, fk_id_endereco) VALUES (?, ?)`,
              [resultadoUsuario.insertId, resultadoEndereco.insertId],
              function (err) {
                if (err) {
                  console.error("Erro ao associar usuário ao endereço:", err);
                  return response.status(500).json({ erro: "Erro ao associar usuário ao endereço" });
                }

                const token = emitirToken({ id_usuario: resultadoUsuario.insertId, nome_login, tipo_usuario: tipo });
                return response.status(201).json({ message: "Usuário criado com sucesso", token });
              }
            );
          }
        );
      }
    );
  } catch (e) {
    console.error(e);
    return response.status(500).json({ erro: "Erro interno" });
  }
}






// API de login
function login(request, response) {
  const { email, senha } = request.body;
  if (!email || !senha) {
    return response.status(400).json({ erro: "Todos os campos são obrigatórios" });
  }

  connection.query(
    `SELECT * FROM Usuario WHERE (email = ? OR nome_login = ?)`,
    [email, email],
    async function (err, resultado) {
      if (err) {
        return response.status(500).json({ erro: "Erro ao buscar o usuário" });
      }
      if (resultado.length === 0) {
        return response.status(401).json({ erro: "Email/usuário ou senha incorretos" });
      }

      const user = resultado[0];
      const ok = await bcrypt.compare(senha, user.senha);
      if (!ok) return response.status(401).json({ erro: "Email/usuário ou senha incorretos" });

      const token = emitirToken(user);

      return response.status(200).json({
        message: "Login bem-sucedido",
        token,
        usuario: {
          id_usuario: user.id_usuario,
          nome_login: user.nome_login,
          tipo_usuario: user.tipo_usuario,
        },
      });
    }
  );
}


const atualizarTipoUsuario = (req, res) => {
  const { id } = req.params;
  const { tipo_usuario } = req.body;

  connection.query(
    `
    UPDATE Usuario
    SET tipo_usuario = ?
    WHERE id_usuario = ?
    `,
    [tipo_usuario, id],
    (error, results) => {
      if (error) {
        console.error("Erro ao atualizar tipo de usuário:", error);
        return res.status(500).json({ error: "Erro ao atualizar tipo de usuário" });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      res.status(200).json({ message: "Tipo de usuário atualizado com sucesso" });
    }
  );
};


module.exports = { list, show, login, create, atualizarTipoUsuario,};
