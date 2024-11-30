const connection = require("../config/mysql.config");

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
  const {
    nome_login,
    email,
    senha,
    telefone,
    igreja_local,
    data_nascimento,
    foto_usuario, // Recebe como Base64 do front-end
    tipo_usuario,
    cep,
    rua,
    numero,
    bairro,
    cidade,
    estado,
  } = request.body;

  // Converte a imagem Base64 para Buffer para armazenar como Blob
  const fotoBuffer = foto_usuario ? Buffer.from(foto_usuario.split(",")[1], 'base64') : null;

  connection.query(
    `INSERT INTO Usuario (nome_login, email, senha, telefone, data_nascimento, igreja_local, foto_usuario, tipo_usuario)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [nome_login, email, senha, telefone, data_nascimento, igreja_local, fotoBuffer, tipo_usuario],
    function (err, resultadoUsuario) {
      if (err) {
        console.error("Erro ao criar usuário:", err);
        return response.status(500).json({ erro: "Erro ao criar usuário" });
      }

      // Insere endereço na tabela `Endereco`
      connection.query(
        `INSERT INTO Endereco (cep, rua, numero, bairro, cidade, estado) VALUES (?, ?, ?, ?, ?, ?)`,
        [cep, rua, numero, bairro, cidade, estado],
        function (err, resultadoEndereco) {
          if (err) {
            console.error("Erro ao inserir endereço:", err);
            return response.status(500).json({ erro: "Erro ao inserir endereço" });
          }

          // Relaciona o usuário ao endereço
          connection.query(
            `INSERT INTO Usuario_Endereco (fk_id_usuario, fk_id_endereco) VALUES (?, ?)`,
            [resultadoUsuario.insertId, resultadoEndereco.insertId],
            function (err) {
              if (err) {
                console.error("Erro ao associar usuário ao endereço:", err);
                return response.status(500).json({ erro: "Erro ao associar usuário ao endereço" });
              }
              console.log("Usuário criado com sucesso");
              return response.status(201).json({ message: "Usuário criado com sucesso" });
            }
          );
        }
      );
    }
  );
}





// API de login
function login(request, response) {
  const { email, senha } = request.body;

  // Validação de entrada
  if (!email || !senha) {
    return response.status(400).json({ erro: "Todos os campos são obrigatórios" });
  }

  connection.query(
    `SELECT * FROM Usuario WHERE (email = ? OR nome_login = ?) AND senha = ?`,
    [email, email, senha],
    function (err, resultado) {
      if (err) {
        return response.status(500).json({ erro: "Erro ao buscar o usuário" });
      }
      if (resultado.length === 0) {
        return response.status(401).json({ erro: "Email ou senha incorretos" });
      }

      // Retornar dados do usuário
      return response.status(200).json({
        message: "Login bem-sucedido",
        usuario: {
          id_usuario: resultado[0].id_usuario,
          nome_login: resultado[0].nome_login,
          tipo_usuario: resultado[0].tipo_usuario,
        },
      });
    }
  );
}



module.exports = { list, show, login, create};
