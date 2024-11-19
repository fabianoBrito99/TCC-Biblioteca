const connection = require("../config/mysql.config"); // Conexão com o banco de dados

async function criarComentario(req, res) {
  const { comentario, fk_id_usuario, fk_id_livro } = req.body;
  const data_comentario = new Date();

  try {
    // Insere o comentário na tabela `Comentarios`
    const [resultado] = await connection
      .promise()
      .query(
        `INSERT INTO Comentarios (comentario, data_comentario) VALUES (?, ?)`,
        [comentario, data_comentario]
      );

    const id_comentario = resultado.insertId;

    // Associar o comentário ao usuário e ao livro
    await connection
      .promise()
      .query(
        `INSERT INTO Comentarios_usuario (fk_id_comentario, fk_id_usuario) VALUES (?, ?)`,
        [id_comentario, fk_id_usuario]
      );

    await connection
      .promise()
      .query(
        `INSERT INTO Comentarios_livro (fk_id_comentario, fk_id_livro) VALUES (?, ?)`,
        [id_comentario, fk_id_livro]
      );

    // Consulta final para buscar o comentário com as informações do usuário
    const [comentarioCompleto] = await connection.promise().query(
      `SELECT 
        c.id_comentario,
        c.comentario,
        c.data_comentario,
        u.nome_login,
        u.foto_usuario,
        COUNT(cc.fk_id_usuario) AS curtidas,
        0 AS usuario_curtiu
      FROM Comentarios c
      LEFT JOIN Comentarios_usuario cu ON cu.fk_id_comentario = c.id_comentario
      LEFT JOIN Usuario u ON u.id_usuario = cu.fk_id_usuario
      LEFT JOIN curtida_comentario cc ON cc.fk_id_comentario = c.id_comentario
      WHERE c.id_comentario = ?
      GROUP BY c.id_comentario, u.id_usuario`,
      [id_comentario]
    );

    // Conversão do Buffer da imagem para Base64
    let fotoBase64 = null;
    if (comentarioCompleto[0].foto_usuario) {
      fotoBase64 = `data:image/jpeg;base64,${Buffer.from(
        comentarioCompleto[0].foto_usuario
      ).toString("base64")}`;
    }

    // Responde com o comentário completo e a imagem em Base64
    return res.status(201).json({
      id_comentario: comentarioCompleto[0].id_comentario,
      comentario: comentarioCompleto[0].comentario,
      data_comentario: comentarioCompleto[0].data_comentario,
      nome_login: comentarioCompleto[0].nome_login,
      foto_usuario: fotoBase64,
      curtidas: comentarioCompleto[0].curtidas,
      usuario_curtiu: comentarioCompleto[0].usuario_curtiu,
      respostas: [],
    });
  } catch (err) {
    console.error("Erro ao criar comentário:", err);
    return res.status(500).json({ error: "Erro ao criar comentário" });
  }
}

// Listar comentários de um livro com respostas e avaliações
// controllers/comentario.controllers.js
async function listarComentariosPorLivro(req, res) {
  const { idLivro } = req.params;
  const { usuarioId } = req.query;

  const query = `
    SELECT 
      c.id_comentario,
      c.comentario,
      c.data_comentario,
      COUNT(DISTINCT curtidas.fk_id_usuario) AS curtidas_totais,
      CASE WHEN EXISTS (
        SELECT 1 
        FROM curtida_comentario cu 
        WHERE cu.fk_id_comentario = c.id_comentario 
          AND cu.fk_id_usuario = ?
      ) THEN 1 ELSE 0 END AS usuario_curtiu,

      -- Subconsultas para nome e foto do autor do comentário
      (SELECT u.nome_login 
       FROM Usuario u 
       JOIN Comentarios_usuario cu ON cu.fk_id_usuario = u.id_usuario 
       WHERE cu.fk_id_comentario = c.id_comentario
       LIMIT 1) AS nome_login_comentario,

      (SELECT TO_BASE64(u.foto_usuario) 
       FROM Usuario u 
       JOIN Comentarios_usuario cu ON cu.fk_id_usuario = u.id_usuario 
       WHERE cu.fk_id_comentario = c.id_comentario
       LIMIT 1) AS foto_usuario_comentario,

      -- Dados das respostas
      r.id_resposta_comentario,
      r.resposta,
      r.data_resposta,
      ur.nome_login AS nome_login_resposta,
      TO_BASE64(ur.foto_usuario) AS foto_usuario_resposta

    FROM Comentarios c
    LEFT JOIN curtida_comentario curtidas ON curtidas.fk_id_comentario = c.id_comentario
    LEFT JOIN resposta_comentario r ON r.fk_id_comentario = c.id_comentario
    LEFT JOIN Usuario ur ON r.fk_id_usuario = ur.id_usuario

    WHERE c.id_comentario IN (
      SELECT fk_id_comentario 
      FROM Comentarios_livro 
      WHERE fk_id_livro = ?
    )
    GROUP BY c.id_comentario, r.id_resposta_comentario
  `;

  try {
    const [comentarios] = await connection
      .promise()
      .query(query, [usuarioId, idLivro]);

    const comentariosMap = {};
    comentarios.forEach((comentario) => {
      const id_comentario = comentario.id_comentario;

      if (!comentariosMap[id_comentario]) {
        comentariosMap[id_comentario] = {
          id_comentario,
          comentario: comentario.comentario,
          data_comentario: comentario.data_comentario,
          curtidas: comentario.curtidas_totais,
          usuario_curtiu: comentario.usuario_curtiu === 1, // Booleano para indicar curtida
          nome_login_comentario: comentario.nome_login_comentario,
          foto_usuario_comentario: comentario.foto_usuario_comentario
            ? `data:image/jpeg;base64,${comentario.foto_usuario_comentario}`
            : null,
          respostas: [],
        };
      }

      if (comentario.id_resposta_comentario) {
        comentariosMap[id_comentario].respostas.push({
          id_resposta: comentario.id_resposta_comentario,
          resposta: comentario.resposta,
          data_resposta: comentario.data_resposta,
          nome_login_resposta: comentario.nome_login_resposta,
          foto_usuario_resposta: comentario.foto_usuario_resposta
            ? `data:image/jpeg;base64,${comentario.foto_usuario_resposta}`
            : null,
        });
      }
    });

    const comentariosList = Object.values(comentariosMap);

    res.json(comentariosList);
  } catch (error) {
    console.error("Erro ao listar comentários:", error);
    res.status(500).json({ error: "Erro ao listar comentários" });
  }
}



// Curtir ou descurtir um comentário
async function curtirComentario(req, res) {
  const { idComentario, fk_id_usuario } = req.body;

  try {
    const [existeCurtida] = await connection
      .promise()
      .query(
        `SELECT * FROM curtida_comentario WHERE fk_id_comentario = ? AND fk_id_usuario = ?`,
        [idComentario, fk_id_usuario]
      );

    if (existeCurtida.length) {
      // Remover curtida
      await connection
        .promise()
        .query(
          `DELETE FROM curtida_comentario WHERE fk_id_comentario = ? AND fk_id_usuario = ?`,
          [idComentario, fk_id_usuario]
        );
    } else {
      // Adicionar curtida
      await connection
        .promise()
        .query(
          `INSERT INTO curtida_comentario (fk_id_comentario, fk_id_usuario) VALUES (?, ?)`,
          [idComentario, fk_id_usuario]
        );
    }

    // Busca o total atualizado de curtidas
    const [[{ curtidas_totais }]] = await connection
      .promise()
      .query(
        `SELECT COUNT(*) AS curtidas_totais FROM curtida_comentario WHERE fk_id_comentario = ?`,
        [idComentario]
      );

    res.json({ message: existeCurtida.length ? "Descurtido com sucesso" : "Curtido com sucesso", curtidas_totais });
  } catch (error) {
    console.error("Erro ao curtir/descurtir comentário:", error);
    res.status(500).json({ error: "Erro ao curtir/descurtir comentário" });
  }
}


// Responder a um comentário
async function responderComentario(req, res) {
  const { idComentario, fk_id_usuario, resposta } = req.body;
  const data_resposta = new Date();

  try {
    // Inserir a resposta na tabela `resposta_comentario`
    const [resultado] = await connection
      .promise()
      .query(
        `INSERT INTO resposta_comentario (fk_id_comentario, fk_id_usuario, resposta, data_resposta) VALUES (?, ?, ?, ?)`,
        [idComentario, fk_id_usuario, resposta, data_resposta]
      );

    const respostaId = resultado.insertId;

    // Recuperar os detalhes da resposta recém-adicionada, incluindo o usuário e a imagem
    const [detalhesResposta] = await connection.promise().query(
      `
      SELECT 
        rc.id_resposta_comentario AS id_resposta,
        rc.resposta,
        rc.data_resposta,
        u.nome_login,
        u.foto_usuario
      FROM resposta_comentario rc
      JOIN Usuario u ON rc.fk_id_usuario = u.id_usuario
      WHERE rc.id_resposta_comentario = ?
      `,
      [respostaId]
    );

    // Conversão de `foto_usuario` para Base64, caso exista
    let fotoBase64 = null;
    if (detalhesResposta[0].foto_usuario) {
      fotoBase64 = `data:image/jpeg;base64,${Buffer.from(
        detalhesResposta[0].foto_usuario
      ).toString("base64")}`;
    }

    // Responder com a resposta completa e a foto convertida em Base64
    return res.status(201).json({
      message: "Resposta adicionada com sucesso",
      resposta: {
        id_resposta: detalhesResposta[0].id_resposta,
        resposta: detalhesResposta[0].resposta,
        data_resposta: detalhesResposta[0].data_resposta,
        nome_login: detalhesResposta[0].nome_login,
        foto_usuario: fotoBase64,
      },
    });
  } catch (err) {
    console.error("Erro ao responder comentário:", err);
    return res.status(500).json({ error: "Erro ao processar a solicitação" });
  }
}

module.exports = {
  criarComentario,
  listarComentariosPorLivro,
  curtirComentario,
  responderComentario,
};
