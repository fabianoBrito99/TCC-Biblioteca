const connection = require("../config/mysql.config");

// Lista as avaliações de um livro
function listaAvaliacoes(request, response) {
  const { livroId } = request.params;

  const query = `
    SELECT 
      a.nota, 
      a.comentario, 
      a.data_avaliacao, 
      u.nome_login AS nome_usuario, 
      u.foto_usuario AS foto_usuario
    FROM Avaliacoes a
    JOIN Avaliacoes_livro al ON a.id_avaliacoes = al.fk_id_avaliacoes
    JOIN Usuario u ON a.fk_id_usuario = u.id_usuario
    WHERE al.fk_id_livro = ?;
  `;

  connection.query(query, [livroId], (err, resultado) => {
    if (err) {
      return response.status(500).json({ erro: "Erro ao buscar avaliações do livro" });
    }

    // Converte as fotos para base64
    const avaliacoesComBase64 = resultado.map(avaliacao => {
      return {
        ...avaliacao,
        foto_usuario: avaliacao.foto_usuario ? Buffer.from(avaliacao.foto_usuario).toString('base64') : null
      };
    });

    response.json({ avaliacoes: avaliacoesComBase64 });
  });
}


// Adiciona uma nova avaliação
function adicionaAvaliacao(request, response) {
  const { comentario, avaliacao, fk_id_livro, fk_id_usuario } = request.body;
  const data_avaliacao = new Date();

  connection.query(
    `INSERT INTO Avaliacoes (comentario, nota, data_avaliacao, fk_id_usuario) VALUES (?, ?, ?, ?)`,
    [comentario, avaliacao, data_avaliacao, fk_id_usuario],
    (err, resultado) => {
      if (err) return response.status(500).json({ erro: "Erro ao inserir avaliação" });
      const id_avaliacao = resultado.insertId;

      connection.query(
        `INSERT INTO Avaliacoes_livro (fk_id_avaliacoes, fk_id_livro) VALUES (?, ?)`,
        [id_avaliacao, fk_id_livro],
        (err) => {
          if (err) return response.status(500).json({ erro: "Erro ao associar avaliação ao livro" });
          return response.status(201).json({ mensagem: "Avaliação adicionada com sucesso" });
        }
      );
    }
  );
}

module.exports = { listaAvaliacoes, adicionaAvaliacao };
