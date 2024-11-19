const connection = require("../config/mysql.config");

function criarComunidade(req, res) { 
  const { nome, descricao, objetivo, tipo, id_adm } = req.body;
  try {
    connection.query(
      "INSERT INTO Comunidade (nome, descricao, objetivo, tipo, id_adm) VALUES (?, ?, ?, ?, ?)",
      [nome, descricao, objetivo, tipo, id_adm],
      (error, result) => {
        if (error) {
          console.error("Erro ao inserir comunidade:", error);
          return res.status(500).json({ error: "Erro ao criar comunidade" });
        }
        res.status(201).json({ id: result.insertId, message: "Comunidade criada!" });
      }
    );
  } catch (error) {
    console.error("Erro no servidor:", error);
    res.status(500).json({ error: "Erro ao criar comunidade" });
  }
}


function listarComunidades(req, res) {
  try {
    connection.query("SELECT * FROM Comunidade", (err, comunidades) => {
      if (err) {
        return res.status(500).json({ error: "Erro ao listar comunidades" });
      }

      // Verifica se existem comunidades
      if (comunidades.length === 0) {
        return res.status(404).json({ message: "Ainda não existem comunidades" });
      }

      res.json(comunidades);
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar comunidades" });
  }
}
function obterComunidade(req, res) {
  const { id } = req.params;

  try {
    // Usando callback para tratar o resultado da query
    connection.query("SELECT * FROM Comunidade WHERE id_comunidade = ?", [id], (error, results) => {
      if (error) {
        console.error("Erro ao buscar comunidade:", error); // Log do erro para depuração
        return res.status(500).json({ error: "Erro ao buscar comunidade" });
      }

      // Verifica se a comunidade foi encontrada
      if (!results || results.length === 0) {
        return res.status(404).json({ error: "Comunidade não encontrada" });
      }

      // Retorna a comunidade encontrada
      res.json(results[0]);
    });
  } catch (error) {
    console.error("Erro inesperado:", error); // Log para erros inesperados fora do callback
    res.status(500).json({ error: "Erro inesperado ao buscar comunidade" });
  }
}


function entrarComunidade(req, res) {
  const { id } = req.params;
  const { fk_id_usuario } = req.body;
  const status = req.body.tipo === "publica" ? "aceito" : "pendente";
  try {
    connection.query(
      "INSERT INTO Comunidade_usuario (fk_id_comunidade, fk_id_usuario, status) VALUES (?, ?, ?)",
      [id, fk_id_usuario, status]
    );
    res.status(200).json({ message: status === "aceito" ? "Entrou na comunidade!" : "Solicitação pendente!" });
  } catch (error) {
    res.status(500).json({ error: "Erro ao solicitar entrada" });
  }
}

function listarComentarios(req, res) {
  const { id } = req.params;

  try {
    connection.query(
      `
      SELECT c.*, 
             u.nome_login AS nome_usuario, 
             u.foto_usuario AS foto_usuario
      FROM Comentarios AS c
      JOIN Comentarios_Comunidade AS cc ON cc.fk_id_comentario = c.id_comentario
      JOIN Comentarios_usuario AS cu ON cu.fk_id_comentario = c.id_comentario
      JOIN Usuario AS u ON cu.fk_id_usuario = u.id_usuario
      WHERE cc.fk_id_comunidade = ?
      ORDER BY c.data_comentario DESC
      `,
      [id],
      (error, resultados) => {
        if (error) {
          console.error("Erro ao listar comentários da comunidade:", error);
          return res
            .status(500)
            .json({ error: "Erro ao listar comentários da comunidade" });
        }

        // Converte o buffer da foto para Base64
        const resultadosConvertidos = resultados.map((comentario) => ({
          ...comentario,
          foto_usuario: comentario.foto_usuario
            ? `data:image/jpeg;base64,${Buffer.from(
                comentario.foto_usuario
              ).toString("base64")}`
            : null, // Caso não tenha foto, retorna null
        }));

        res.json(resultadosConvertidos);
      }
    );
  } catch (error) {
    console.error("Erro inesperado ao listar comentários da comunidade:", error);
    res
      .status(500)
      .json({ error: "Erro inesperado ao listar comentários da comunidade" });
  }
}



function adicionarComentario(req, res) {
  const { id } = req.params; // id da comunidade
  const { comentario, fk_id_usuario } = req.body;

  connection.beginTransaction(async (err) => {
    if (err) {
      console.error("Erro ao iniciar transação:", err);
      return res.status(500).json({ error: "Erro ao iniciar transação" });
    }

    try {
      // Insere o comentário na tabela Comentarios
      const comentarioResult = await new Promise((resolve, reject) => {
        connection.query(
          "INSERT INTO Comentarios (comentario, data_comentario) VALUES (?, NOW())",
          [comentario],
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          }
        );
      });

      const comentarioId = comentarioResult.insertId;

      // Associa o comentário à comunidade
      await new Promise((resolve, reject) => {
        connection.query(
          "INSERT INTO Comentarios_Comunidade (fk_id_comentario, fk_id_comunidade) VALUES (?, ?)",
          [comentarioId, id],
          (error) => {
            if (error) return reject(error);
            resolve();
          }
        );
      });

      // Associa o comentário ao usuário
      await new Promise((resolve, reject) => {
        connection.query(
          "INSERT INTO Comentarios_usuario (fk_id_comentario, fk_id_usuario) VALUES (?, ?)",
          [comentarioId, fk_id_usuario],
          (error) => {
            if (error) return reject(error);
            resolve();
          }
        );
      });

      // Confirma a transação
      connection.commit((commitErr) => {
        if (commitErr) {
          connection.rollback(() => {
            console.error("Erro ao confirmar transação:", commitErr);
            return res.status(500).json({ error: "Erro ao confirmar transação" });
          });
        } else {
          res
            .status(201)
            .json({ id: comentarioId, message: "Comentário adicionado com sucesso!" });
        }
      });
    } catch (error) {
      // Desfaz a transação em caso de erro
      connection.rollback(() => {
        console.error("Erro ao adicionar comentário:", error);
        res.status(500).json({ error: "Erro ao adicionar comentário" });
      });
    }
  });
}

function registrarProgresso(req, res) {
  const { id } = req.params; // id da comunidade
  const { fk_id_usuario, paginas_lidas } = req.body;

  try {
    console.log("Dados recebidos:", { fk_id_usuario, id, paginas_lidas }); // Log para verificar os valores

    connection.query(
      "INSERT INTO Progresso (fk_id_usuario, fk_id_comunidade, paginas_lidas, data) VALUES (?, ?, ?, NOW())",
      [fk_id_usuario, id, paginas_lidas]
    );
    res.status(201).json({ message: "Progresso registrado!" });
  } catch (error) {
    console.error("Erro ao registrar progresso:", error); // Log do erro
    res.status(500).json({ error: "Erro ao registrar progresso" });
  }
}


function listarProgresso(req, res) {
  const { id } = req.params; // ID da comunidade
  connection.query(
    `SELECT u.nome_login AS nome_usuario, SUM(p.paginas_lidas) AS paginas_lidas
     FROM Progresso AS p
     JOIN Usuario AS u ON p.fk_id_usuario = u.id_usuario
     WHERE p.fk_id_comunidade = ?
     GROUP BY u.nome_login
     ORDER BY paginas_lidas DESC`,
    [id],
    (error, results) => {
      if (error) {
        console.error("Erro ao buscar progresso:", error);
        return res.status(500).json({ error: "Erro ao buscar progresso" });
      }
      res.json(results);
    }
  );
}

function estatisticasIdade(req, res) {
  const { id } = req.params; // ID da comunidade
  connection.query(
    `SELECT 
       CASE 
         WHEN TIMESTAMPDIFF(YEAR, u.data_nascimento, CURDATE()) < 18 THEN 'Menor de 18'
         WHEN TIMESTAMPDIFF(YEAR, u.data_nascimento, CURDATE()) BETWEEN 18 AND 24 THEN '18-24'
         WHEN TIMESTAMPDIFF(YEAR, u.data_nascimento, CURDATE()) BETWEEN 25 AND 34 THEN '25-34'
         WHEN TIMESTAMPDIFF(YEAR, u.data_nascimento, CURDATE()) BETWEEN 35 AND 44 THEN '35-44'
         ELSE '45+' 
       END AS faixa_etaria,
       COUNT(DISTINCT cu.fk_id_usuario) AS quantidade, -- Número de usuários na faixa
       COALESCE(SUM(DISTINCT p.paginas_lidas), 0) AS paginas_lidas -- Soma das páginas lidas
     FROM Comunidade_usuario AS cu
     JOIN Usuario AS u ON cu.fk_id_usuario = u.id_usuario
     JOIN Comunidade AS co ON cu.fk_id_comunidade = co.id_comunidade
     LEFT JOIN Progresso AS p 
       ON cu.fk_id_usuario = p.fk_id_usuario 
       AND cu.fk_id_comunidade = p.fk_id_comunidade
     WHERE cu.fk_id_comunidade = ? AND cu.status = 'aceito'
     GROUP BY faixa_etaria`,
    [id],
    (error, results) => {
      if (error) {
        console.error("Erro ao buscar estatísticas de idade:", error);
        return res.status(500).json({ error: "Erro ao buscar estatísticas de idade" });
      }
      res.json(results);
    }
  );
}




module.exports = { criarComunidade, listarComunidades, obterComunidade, entrarComunidade, listarComentarios, adicionarComentario, listarProgresso, estatisticasIdade, registrarProgresso };
