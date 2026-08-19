const connection = require("../config/mysql.config");

function gerarNotificacoes(req, res) {
  const { idUsuario } = req.params;

  connection.query(
    `
    SELECT
      e.id_emprestimo,
      l.nome_livro,
      e.data_prevista_devolucao,
      DATEDIFF(e.data_prevista_devolucao, CURDATE()) AS dias_restantes
    FROM Emprestimos AS e
    JOIN Usuario_Emprestimos AS ue ON ue.fk_id_emprestimo = e.id_emprestimo
    JOIN Livro AS l ON e.fk_id_livros = l.id_livro
    WHERE ue.fk_id_usuario = ?
      AND e.data_devolucao IS NULL
      AND DATEDIFF(e.data_prevista_devolucao, CURDATE()) <= 10
    `,
    [idUsuario],
    (error, resultados) => {
      if (error) {
        console.error("Erro ao buscar livros vencendo:", error);
        return res.status(500).json({ error: "Erro ao buscar livros vencendo." });
      }

      resultados.forEach((emprestimo) => {
        const mensagem =
          emprestimo.dias_restantes > 0
            ? `O livro "${emprestimo.nome_livro}" deve ser devolvido em ${emprestimo.dias_restantes} dias.`
            : `O prazo para devolver o livro "${emprestimo.nome_livro}" ja venceu.`;

        connection.query(
          `
          SELECT COUNT(*) AS notificacaoExistente
          FROM Notificacoes
          WHERE fk_id_usuario = ?
            AND mensagem = ?
            AND lida = 0
          `,
          [idUsuario, mensagem],
          (checkError, checkResult) => {
            if (checkError) {
              console.error("Erro ao verificar notificacoes existentes:", checkError);
              return;
            }

            if (checkResult[0].notificacaoExistente === 0) {
              connection.query(
                `
                INSERT INTO Notificacoes (mensagem, tipo, data_criacao, lida, fk_id_usuario)
                VALUES (?, 'livro', NOW(), 0, ?)
                `,
                [mensagem, idUsuario],
                (insertError) => {
                  if (insertError) {
                    console.error("Erro ao inserir notificacao:", insertError);
                  }
                }
              );
            }
          }
        );
      });

      res.status(200).json({ message: "Notificacoes verificadas e geradas com sucesso." });
    }
  );
}

function listarNotificacoes(req, res) {
  const { idUsuario } = req.params;

  connection.query(
    `
    SELECT
      id_notificacao,
      mensagem,
      tipo,
      data_criacao,
      lida
    FROM Notificacoes
    WHERE fk_id_usuario = ?
    ORDER BY data_criacao DESC
    `,
    [idUsuario],
    (error, results) => {
      if (error) {
        console.error("Erro ao buscar notificacoes:", error);
        return res.status(500).json({ error: "Erro ao buscar notificacoes." });
      }

      res.json(results);
    }
  );
}

function marcarNotificacaoLida(req, res) {
  const { idNotificacao } = req.params;
  const userId = Number(req.user.id);
  const isAdmin = req.user.tipo_usuario === "admin";

  connection.query(
    `
    UPDATE Notificacoes
    SET lida = 1
    WHERE id_notificacao = ?
      AND (? = true OR fk_id_usuario = ?)
    `,
    [idNotificacao, isAdmin, userId],
    (error, results) => {
      if (error) {
        console.error("Erro ao marcar notificacao como lida:", error);
        return res.status(500).json({ error: "Erro ao atualizar notificacao." });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ error: "Notificacao nao encontrada." });
      }

      res.status(200).json({ message: "Notificacao marcada como lida." });
    }
  );
}

module.exports = {
  gerarNotificacoes,
  listarNotificacoes,
  marcarNotificacaoLida,
};
