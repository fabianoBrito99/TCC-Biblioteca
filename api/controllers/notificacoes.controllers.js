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
            : `EEEIII PAIZÃO VAMOS DEVOLVER O LIVRO EM, JÁ VENCEU A DATA, O prazo para devolver o livro "${emprestimo.nome_livro}"😡😡`;

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
              console.error("Erro ao verificar notificações existentes:", checkError);
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
                    console.error("Erro ao inserir notificação:", insertError);
                  }
                }
              );
            }
          }
        );
      });

      res.status(200).json({ message: "Notificações verificadas e geradas com sucesso." });
    }
  );
}



function listarNotificacoes(req, res) {
  const { idUsuario } = req.params; // Certifique-se de que o ID do usuário é passado corretamente

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
    ORDER BY data_criacao DESC`,
    [idUsuario],
    (error, results) => {
      if (error) {
        console.error("Erro ao buscar notificações:", error);
        return res.status(500).json({ error: "Erro ao buscar notificações." });
      }

      res.json(results);
    }
  );
}



function marcarNotificacaoLida(req, res) {
  const { idNotificacao } = req.params;

  connection.query(
    `
    UPDATE Notificacoes 
    SET lida = 1 
    WHERE id_notificacao = ?
    `,
    [idNotificacao],
    (error) => {
      if (error) {
        console.error("Erro ao marcar notificação como lida:", error);
        return res.status(500).json({ error: "Erro ao atualizar notificação." });
      }

      res.status(200).json({ message: "Notificação marcada como lida." });
    }
  );
}


module.exports = {
  gerarNotificacoes,
  listarNotificacoes,
  marcarNotificacaoLida,
};
