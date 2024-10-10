const connection = require("../config/mysql.config");

function list(request, response) {
  connection.query(
    `SELECT id_user, nome_login, email FROM usuarios`,
    function (err, resultado) {
      if (err) {
        return response.json({ erro: "Ocorreu um erro ao buscar os usuários" });
      }
      return response.json({ dados: resultado });
    }
  );
}

function show(request, response) {
  const userId = request.params.id;

  // Primeiro, obtenha os dados do usuário
  connection.query(
    `SELECT * FROM usuarios WHERE id_user = ?`,
    [userId],
    function (err, usuario) {
      if (err) {
        return response.json({ erro: "Ocorreu um erro ao buscar os detalhes do usuário" });
      }
      if (usuario.length === 0) {
        return response.json({ erro: "Usuário não encontrado" });
      }

      // Agora, obtenha o histórico de empréstimos desse usuário
      connection.query(
        `SELECT e.id, l.nome_livro, l.foto_capa, e.data_emprestimo, e.devolucao 
         FROM emprestimos e
         JOIN livros l ON e.livro_id = l.id
         WHERE e.usuario_id  = ?`,
        [userId],
        function (err, historico) {
          if (err) {
            return response.json({ erro: "Ocorreu um erro ao buscar o histórico de empréstimos" });
          }

          // Convertendo o BLOB da imagem para Base64 em cada item do histórico
          historico.forEach(emprestimo => {
            if (emprestimo.foto_capa) {
              emprestimo.foto_capa = `data:image/jpeg;base64,${Buffer.from(emprestimo.foto_capa).toString('base64')}`;
            }
          });

          // Combine os dados do usuário com o histórico de empréstimos e envie a resposta
          return response.json({
            usuario: usuario[0],
            historico: historico
          });
        }
      );
    }
  );
}



function login(request, response) {
  const { email, senha } = request.body;

  if (!email || !senha) {
    return response.status(400).json({ erro: "Todos os campos são obrigatórios" });
  }

  connection.query(
    "SELECT * FROM usuarios WHERE (email = ? OR nome_login = ?) AND senha = ?",
    [email, email, senha],
    function (err, resultado) {
      if (err) {
        return response.status(500).json({ erro: "Erro ao buscar o usuário" });
      }
      if (resultado.length === 0) {
        return response.status(401).json({ erro: "Email ou senha incorretos" });
      }
      return response.status(200).json({ message: "Login bem-sucedido" });
    }
  );
}

function create(request, response) {
  const { nome_login, email, senha, telefone, igrejaLocal, cep, rua, numero, bairro } = request.body;

  if (!nome_login || !email || !senha) {
    return response.status(400).json({ erro: "Os campos obrigatórios não foram preenchidos" });
  }

  connection.query(
    "INSERT INTO usuarios (nome_login, email, senha, telefone, igrejaLocal, cep, rua, numero, bairro) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    [nome_login, email, senha, telefone, igrejaLocal, cep, rua, numero, bairro],
    function (err, resultado) {
      if (err) {
        return response.status(500).json({ erro: "Erro ao criar usuário" });
      }
      return response.status(201).json({ menssage: "Usuário criado com sucesso" });
    }
  );
}

module.exports = { list, show, login, create };
