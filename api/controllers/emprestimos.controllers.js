const connection = require("../config/mysql.config");
const fs = require('fs');

function list(request, response) {
  connection.query(
    `SELECT e.id, u.nome_login AS nome_usuario, l.nome_livro AS nome_livro, l.foto_capa, e.data_prevista_devolucao, e.devolucao
     FROM emprestimos e
     JOIN usuarios u ON e.usuario_id = u.id_user
     JOIN livros l ON e.livro_id = l.id
     WHERE e.devolucao IS NULL`,
    function (err, resultado) {
      if (err) {
        return response.json({ erro: "Ocorreu um erro ao buscar os dados" });
      }

      resultado.forEach(emprestimo => {
        if (emprestimo.foto_capa) {
          // Convertendo BLOB ou caminho para Base64
          emprestimo.foto_capa = `data:image/jpeg;base64,${Buffer.from(emprestimo.foto_capa).toString('base64')}`;
        }
      });

      return response.json({ dados: resultado });
    }
  );
}

function show(request, response) {
  const idEmprestimo = request.params.id;

  connection.query(
    `SELECT e.id, u.nome_login AS nome_usuario, l.nome_livro AS nome_livro, l.foto_capa, e.data_prevista_devolucao, e.data_emprestimo, e.devolucao
     FROM emprestimos e
     JOIN usuarios u ON e.usuario_id = u.id_user
     JOIN livros l ON e.livro_id = l.id
     WHERE e.id = ?`,
    [idEmprestimo],
    function (err, resultado) {
      if (err) {
        return response.json({ erro: "Erro ao buscar detalhes do empréstimo." });
      }

      if (resultado.length === 0) {
        return response.json({ erro: "Empréstimo não encontrado." });
      }

      let emprestimo = resultado[0];

      if (emprestimo.foto_capa) {
        // Convertendo BLOB para Base64
        emprestimo.foto_capa = `data:image/jpeg;base64,${Buffer.from(emprestimo.foto_capa).toString('base64')}`;
      }

      return response.json({ dados: emprestimo });
    }
  );
}


function reservar(request, response) {
  const livroId = request.params.id;
  const usuarioId = request.body.usuarioId;
  const dataAtual = new Date();
  const dataPrevistaDevolucao = new Date(dataAtual);
  dataPrevistaDevolucao.setDate(dataAtual.getDate() + 30); // Define a data prevista de devolução para 30 dias após a data atual

  console.log(`Tentando reservar livro com ID: ${livroId} para o usuário com ID: ${usuarioId}`);

  // Verifica se há quantidade disponível
  connection.query(
    "SELECT quantidade FROM livros WHERE id = ?",
    [livroId],
    function (err, resultado) {
      if (err) {
        console.error("Erro ao verificar a quantidade do livro:", err);
        return response.json({ erro: "Erro ao verificar a quantidade do livro." });
      }

      if (resultado.length === 0) {
        console.error("Livro não encontrado.");
        return response.json({ erro: "Livro não encontrado." });
      }

      if (resultado[0].quantidade <= 0) {
        console.log("Não há livros disponíveis para reserva.");
        return response.json({ erro: "Não há livros disponíveis para reserva." });
      }

      // Decrementa a quantidade do livro
      connection.query(
        "UPDATE livros SET quantidade = quantidade - 1 WHERE id = ?",
        [livroId],
        function (err) {
          if (err) {
            console.error("Erro ao atualizar a quantidade do livro:", err);
            return response.json({ erro: "Erro ao atualizar a quantidade do livro." });
          }

          // Adiciona o livro à tabela de empréstimos
          connection.query(
            "INSERT INTO emprestimos (livro_id, usuario_id, data_emprestimo, data_prevista_devolucao) VALUES (?, ?, ?, ?)",
            [livroId, usuarioId, dataAtual, dataPrevistaDevolucao],
            function (err) {
              if (err) {
                // Reverte a quantidade se ocorrer um erro ao adicionar o empréstimo
                connection.query(
                  "UPDATE livros SET quantidade = quantidade + 1 WHERE id = ?",
                  [livroId]
                );
                console.error("Erro ao registrar o empréstimo:", err);
                return response.json({ erro: "Erro ao registrar o empréstimo." });
              }

              // Resposta de sucesso
              console.log("Reserva realizada com sucesso.");
              return response.json({ mensagem: "Você reservou este livro, vá até a biblioteca da igreja nos finais de semana para retirar este livro." });
            }
          );
        }
      );
    }
  );
}

function devolver(request, response) {
  const idEmprestimo = request.params.id;
  const dataAtual = new Date();

  // Primeiro, obtenha o ID do livro do empréstimo
  connection.query(
    "SELECT livro_id FROM emprestimos WHERE id = ?",
    [idEmprestimo],
    function (err, resultado) {
      if (err) {
        return response.json({ erro: "Erro ao obter o livro do empréstimo." });
      }

      if (resultado.length === 0) {
        return response.json({ erro: "Empréstimo não encontrado." });
      }

      const idLivro = resultado[0].livro_id;

      // Atualize a quantidade do livro no banco de dados para indicar que está disponível
      connection.query(
        "UPDATE livros SET quantidade = quantidade + 1 WHERE id = ?",
        [idLivro],
        function (err) {
          if (err) {
            return response.json({ erro: "Erro ao atualizar a quantidade do livro." });
          }

          // Agora, atualize a data de devolução no empréstimo
          connection.query(
            "UPDATE emprestimos SET devolucao = ? WHERE id = ?",
            [dataAtual, idEmprestimo],
            function (err) {
              if (err) {
                return response.json({ erro: "Erro ao atualizar a data de devolução." });
              }
              // Resposta de sucesso
              return response.json({ mensagem: "Livro devolvido com sucesso." });
            }
          );
        }
      );
    }
  );
}


module.exports = { list, show, reservar, devolver };
