const connection = require("../config/mysql.config");

function criarComunidade(req, res) {
  const { nome, descricao, tipo, id_adm } = req.body;

  connection.query(
    "INSERT INTO Comunidade (nome, descricao, tipo, id_adm) VALUES (?, ?, ?, ?)",
    [nome, descricao, tipo, id_adm],
    (error, result) => {
      if (error) {
        console.error("Erro ao inserir comunidade:", error);
        return res.status(500).json({ error: "Erro ao criar comunidade" });
      }

      const comunidadeId = result.insertId;

      // Insere o administrador na comunidade automaticamente
      connection.query(
        "INSERT INTO Comunidade_usuario (fk_id_comunidade, fk_id_usuario, status) VALUES (?, ?, 'aceito')",
        [comunidadeId, id_adm],
        (error) => {
          if (error) {
            console.error(
              "Erro ao adicionar administrador na comunidade:",
              error
            );
            return res
              .status(500)
              .json({ error: "Erro ao adicionar administrador na comunidade" });
          }

          res
            .status(201)
            .json({ id: comunidadeId, message: "Comunidade criada!" });
        }
      );
    }
  );
}

function listarComunidades(req, res) {
  try {
    connection.query("SELECT * FROM Comunidade", (err, comunidades) => {
      if (err) {
        return res.status(500).json({ error: "Erro ao listar comunidades" });
      }

      // Verifica se existem comunidades
      if (comunidades.length === 0) {
        return res
          .status(404)
          .json({ message: "Ainda não existem comunidades" });
      }

      res.json(comunidades);
    });
  } catch (error) {
    res.status(500).json({ error: "Erro ao listar comunidades" });
  }
}

function entrarComunidade(req, res) {
  const { id } = req.params; // ID da comunidade
  const { fk_id_usuario } = req.body;
  const status = req.body.tipo === "publica" ? "aceito" : "pendente";

  try {
    // Verifica se o usuário já está na comunidade
    connection.query(
      `
      SELECT * FROM Comunidade_usuario 
      WHERE fk_id_comunidade = ? AND fk_id_usuario = ?
      `,
      [id, fk_id_usuario],
      (err, results) => {
        if (err) {
          console.error(
            "Erro ao verificar se o usuário já está na comunidade:",
            err
          );
          return res.status(500).json({ error: "Erro ao verificar entrada." });
        }

        if (results.length > 0) {
          return res
            .status(400)
            .json({ message: "Usuário já está na comunidade." });
        }

        // Insere o usuário na comunidade
        connection.query(
          `
          INSERT INTO Comunidade_usuario (fk_id_comunidade, fk_id_usuario, status)
          VALUES (?, ?, ?)
          `,
          [id, fk_id_usuario, status],
          (insertErr) => {
            if (insertErr) {
              console.error("Erro ao inserir na comunidade:", insertErr);
              return res
                .status(500)
                .json({ error: "Erro ao entrar na comunidade." });
            }

            res.status(200).json({
              message:
                status === "aceito"
                  ? "Entrou na comunidade!"
                  : "Solicitação pendente!",
              status,
            });
          }
        );
      }
    );
  } catch (error) {
    console.error("Erro no servidor:", error);
    res.status(500).json({ error: "Erro ao processar a solicitação." });
  }
}

function listarUsuariosComunidade(req, res) {
  const { id } = req.params;

  connection.query(
    `
    SELECT 
      u.id_usuario, 
      u.nome_login, 
      u.email, 
      cu.status 
    FROM Comunidade_usuario AS cu
    JOIN Usuario AS u ON cu.fk_id_usuario = u.id_usuario
    WHERE cu.fk_id_comunidade = ?
    `,
    [id],
    (error, results) => {
      if (error) {
        console.error("Erro ao buscar usuários da comunidade:", error);
        return res.status(500).json({ error: "Erro ao buscar usuários." });
      }

      res.status(200).json(results);
    }
  );
}

function verificarAdmin(req, res) {
  const { id, userId } = req.params;

  connection.query(
    "SELECT id_adm FROM Comunidade WHERE id_comunidade = ?",
    [id],
    (error, results) => {
      if (error) {
        console.error("Erro ao verificar admin:", error);
        return res.status(500).json({ error: "Erro ao verificar admin." });
      }

      if (results.length > 0 && results[0].id_adm === parseInt(userId)) {
        res.status(200).json({ isAdmin: true });
      } else {
        res.status(403).json({ isAdmin: false });
      }
    }
  );
}

function listarComunidadesUsuario(req, res) {
  const { idUsuario } = req.params;

  try {
    connection.query(
      `
      SELECT DISTINCT c.id_comunidade, c.nome, c.descricao, c.tipo
      FROM Comunidade_usuario AS cu
      JOIN Comunidade AS c ON cu.fk_id_comunidade = c.id_comunidade
      WHERE cu.fk_id_usuario = ? AND cu.status = 'aceito'
      `,
      [idUsuario],
      (err, results) => {
        if (err) {
          console.error("Erro ao listar comunidades do usuário:", err);
          return res
            .status(500)
            .json({ error: "Erro ao listar comunidades do usuário." });
        }

        res.json(results);
      }
    );
  } catch (error) {
    console.error("Erro inesperado no servidor:", error);
    res
      .status(500)
      .json({ error: "Erro inesperado ao listar comunidades do usuário." });
  }
}

function obterComunidade(req, res) {
  const { id } = req.params;

  try {
    // Usando callback para tratar o resultado da query
    connection.query(
      "SELECT * FROM Comunidade WHERE id_comunidade = ?",
      [id],
      (error, results) => {
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
      }
    );
  } catch (error) {
    console.error("Erro inesperado:", error); // Log para erros inesperados fora do callback
    res.status(500).json({ error: "Erro inesperado ao buscar comunidade" });
  }
}

function listarUsuariosComunidade(req, res) {
  const { idComunidade } = req.params;

  connection.query(
    `
    SELECT 
      u.id_usuario, 
      u.nome_login, 
      u.email, 
      cu.status 
    FROM Comunidade_usuario AS cu
    JOIN Usuario AS u ON cu.fk_id_usuario = u.id_usuario
    WHERE cu.fk_id_comunidade = ?
    `,
    [idComunidade],
    (error, results) => {
      if (error) {
        console.error("Erro ao listar usuários da comunidade:", error);
        return res
          .status(500)
          .json({ error: "Erro ao listar usuários da comunidade" });
      }

      res.json(results);
    }
  );
}

// Atualiza o status do usuário em uma comunidade
function atualizarStatusUsuario(req, res) {
  const { idUsuario } = req.params;
  const { status } = req.body;
  const comunidadeId = req.params.comunidadeId;

  connection.query(
    `UPDATE Comunidade_usuario 
     SET status = ? 
     WHERE fk_id_comunidade = ? AND fk_id_usuario = ?`,
    [status, comunidadeId, idUsuario],
    (error, results) => {
      if (error) {
        console.error("Erro ao atualizar status do usuário:", error);
        return res
          .status(500)
          .json({ error: "Erro ao atualizar status do usuário" });
      }

      if (results.affectedRows === 0) {
        return res
          .status(404)
          .json({ message: "Usuário ou comunidade não encontrado" });
      }

      res.status(200).json({ message: "Status atualizado com sucesso" });
    }
  );
}

function listarComentarios(req, res) {
  const { id } = req.params;

  try {
    connection.query(
      `
      SELECT c.*, 
             u.nome_login AS nome_usuario, 
             u.foto_usuario AS foto_usuario,
             cu.fk_id_usuario -- Inclui o fk_id_usuario aqui
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
    console.error(
      "Erro inesperado ao listar comentários da comunidade:",
      error
    );
    res
      .status(500)
      .json({ error: "Erro inesperado ao listar comentários da comunidade" });
  }
}

function verificarStatusUsuario(req, res) {
  const { idComunidade, idUsuario } = req.params;

  connection.query(
    `
    SELECT status 
    FROM Comunidade_usuario 
    WHERE fk_id_comunidade = ? AND fk_id_usuario = ?
    `,
    [idComunidade, idUsuario],
    (error, results) => {
      if (error) {
        console.error("Erro ao verificar status do usuário:", error);
        return res
          .status(500)
          .json({ error: "Erro ao verificar status do usuário" });
      }

      if (results.length === 0) {
        return res.status(200).json({ status: "nao_inscrito" });
      }

      res.status(200).json({ status: results[0].status });
    }
  );
}

function listarSolicitacoes(req, res) {
  const { idComunidade } = req.params;

  connection.query(
    `
    SELECT 
      cu.fk_id_usuario AS id_usuario,
      u.nome_login AS nome_usuario,
      cu.status
    FROM Comunidade_usuario AS cu
    JOIN Usuario AS u ON cu.fk_id_usuario = u.id_usuario
    WHERE cu.fk_id_comunidade = ? AND cu.status = 'pendente'
    `,
    [idComunidade],
    (error, results) => {
      if (error) {
        console.error("Erro ao listar solicitações:", error);
        return res.status(500).json({ error: "Erro ao listar solicitações." });
      }

      res.status(200).json(results);
    }
  );
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
            return res
              .status(500)
              .json({ error: "Erro ao confirmar transação" });
          });
        } else {
          res.status(201).json({
            id: comentarioId,
            message: "Comentário adicionado com sucesso!",
          });
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
        return res
          .status(500)
          .json({ error: "Erro ao buscar estatísticas de idade" });
      }
      res.json(results);
    }
  );
}

function criarObjetivo(req, res) {
  const {
    fk_id_comunidade,
    titulo,
    descricao,
    data_inicio,
    data_fim,
    total_paginas,
  } = req.body;

  // Verifica se já existe um objetivo em aberto para a comunidade
  connection.query(
    "SELECT id_objetivo FROM Objetivo WHERE fk_id_comunidade = ? AND data_fim >= CURDATE()",
    [fk_id_comunidade],
    (error, results) => {
      if (error) {
        console.error("Erro ao verificar objetivo ativo:", error);
        return res
          .status(500)
          .json({ error: "Erro ao verificar objetivo ativo" });
      }

      if (results.length > 0) {
        return res.status(400).json({
          error: "Já existe um objetivo em andamento para esta comunidade.",
        });
      }

      // Insere o novo objetivo se não houver um ativo
      connection.query(
        "INSERT INTO Objetivo (fk_id_comunidade, titulo, descricao, data_inicio, data_fim, total_paginas) VALUES (?, ?, ?, ?, ?, ?)",
        [
          fk_id_comunidade,
          titulo,
          descricao,
          data_inicio,
          data_fim,
          total_paginas,
        ],
        (insertError, result) => {
          if (insertError) {
            console.error("Erro ao criar objetivo:", insertError);
            return res.status(500).json({ error: "Erro ao criar objetivo" });
          }
          res.status(201).json({
            id: result.insertId,
            message: "Objetivo criado com sucesso!",
          });
        }
      );
    }
  );
}

function verificarObjetivoAtivo(req, res) {
  const { idComunidade } = req.params;

  connection.query(
    "SELECT id_objetivo FROM Objetivo WHERE fk_id_comunidade = ? AND data_fim >= CURDATE() LIMIT 1",
    [idComunidade],
    (error, results) => {
      if (error) {
        console.error("Erro ao verificar objetivo ativo:", error);
        return res
          .status(500)
          .json({ error: "Erro ao verificar objetivo ativo." });
      }

      res.status(200).json({ ativo: results.length > 0 });
    }
  );
}

function registrarProgressoObjetivo(req, res) {
  const { fk_id_usuario, paginas_lidas } = req.body;
  const { idComunidade } = req.params;

  if (
    !fk_id_usuario ||
    isNaN(fk_id_usuario) ||
    !paginas_lidas ||
    isNaN(paginas_lidas)
  ) {
    return res
      .status(400)
      .json({ error: "ID do usuário ou quantidade de páginas inválido." });
  }

  connection.query(
    `SELECT id_objetivo, total_paginas FROM Objetivo 
     WHERE fk_id_comunidade = ? AND data_fim >= CURDATE()
     ORDER BY data_fim ASC LIMIT 1`,
    [idComunidade],
    (error, results) => {
      if (error) {
        console.error("Erro ao buscar objetivo ativo:", error);
        return res
          .status(500)
          .json({ error: "Erro ao buscar objetivo ativo." });
      }

      if (results.length === 0) {
        return res
          .status(404)
          .json({
            error: "Nenhum objetivo ativo encontrado para esta comunidade.",
          });
      }

      const fk_id_objetivo = results[0].id_objetivo;
      const total_paginas = results[0].total_paginas;

      connection.query(
        "SELECT paginas_lidas FROM ProgressoObjetivo WHERE fk_id_objetivo = ? AND fk_id_usuario = ?",
        [fk_id_objetivo, fk_id_usuario],
        (sumError, sumResults) => {
          if (sumError) {
            console.error("Erro ao calcular progresso total:", sumError);
            return res
              .status(500)
              .json({ error: "Erro ao calcular progresso total." });
          }

          const paginas_totais =
            sumResults.length > 0 ? sumResults[0].paginas_lidas : 0;
          const novas_paginas_totais = paginas_totais + paginas_lidas;

          if (novas_paginas_totais > total_paginas) {
            return res
              .status(400)
              .json({
                error:
                  "A quantidade inserida ultrapassa o total permitido pelo objetivo.",
              });
          }

          connection.query(
            `INSERT INTO ProgressoObjetivo (fk_id_objetivo, fk_id_usuario, paginas_lidas, data_progresso) 
             VALUES (?, ?, ?, CURDATE()) 
             ON DUPLICATE KEY UPDATE 
               paginas_lidas = paginas_lidas + VALUES(paginas_lidas),
               data_progresso = CURDATE()`,
            [fk_id_objetivo, fk_id_usuario, paginas_lidas],
            (insertError) => {
              if (insertError) {
                console.error("Erro ao registrar progresso:", insertError);
                return res
                  .status(500)
                  .json({ error: "Erro ao registrar progresso." });
              }

              res.status(201).json({
                message: "Progresso atualizado com sucesso!",
                paginas_inseridas: paginas_lidas,
              });
            }
          );
        }
      );
    }
  );
}

function listarProgressoObjetivo(req, res) {
  const { id_objetivo } = req.params;

  connection.query(
    `SELECT u.nome_login, SUM(p.paginas_lidas) AS paginas_lidas, o.total_paginas
     FROM ProgressoObjetivo p
     JOIN Usuario u ON p.fk_id_usuario = u.id_usuario
     JOIN Objetivo o ON p.fk_id_objetivo = o.id_objetivo
     WHERE p.fk_id_objetivo = ?
     GROUP BY u.id_usuario, u.nome_login, o.total_paginas
     ORDER BY paginas_lidas DESC`,
    [id_objetivo],
    (error, results) => {
      if (error) {
        console.error("Erro ao buscar progresso:", error);
        return res.status(500).json({ error: "Erro ao buscar progresso" });
      }
      res.json(results);
    }
  );
}

function obterObjetivoAtivo(req, res) {
  const { idComunidade } = req.params;

  connection.query(
    "SELECT id_objetivo FROM Objetivo WHERE fk_id_comunidade = ? AND data_fim >= CURDATE() LIMIT 1",
    [idComunidade],
    (error, results) => {
      if (error) {
        console.error("Erro ao buscar objetivo ativo:", error);
        return res.status(500).json({ error: "Erro ao buscar objetivo ativo" });
      }

      if (results.length === 0) {
        return res
          .status(404)
          .json({ error: "Nenhum objetivo ativo encontrado." });
      }

      res.status(200).json({ idObjetivo: results[0].id_objetivo });
    }
  );
}

function listarTopLeitores(req, res) {
  const { id } = req.params;

  connection.query(
    `SELECT u.nome_login AS nome_usuario, u.foto_usuario, SUM(p.paginas_lidas) AS paginas_lidas
     FROM ProgressoObjetivo AS p
     JOIN Usuario AS u ON p.fk_id_usuario = u.id_usuario
     JOIN objetivo AS o ON o.id_objetivo = p.fk_id_objetivo
     WHERE o.fk_id_comunidade = ?
     GROUP BY u.id_usuario
     ORDER BY paginas_lidas DESC
     LIMIT 10`,
    [id],
    (error, results) => {
      if (error) {
        console.error("Erro ao buscar top leitores:", error);
        return res.status(500).json({ error: "Erro ao buscar top leitores" });
      }

      const convertidos = results.map((usuario) => ({
        ...usuario,
        foto_usuario: usuario.foto_usuario
          ? `data:image/jpeg;base64,${Buffer.from(
              usuario.foto_usuario
            ).toString("base64")}`
          : null,
      }));

      res.json(convertidos);
    }
  );
}

function leituraDiariaUsuario(req, res) {
  const { idUsuario, idComunidade } = req.params;

  connection.query(
    `SELECT DATE(po.data_progresso) AS dia, SUM(po.paginas_lidas) AS total
     FROM ProgressoObjetivo AS po
     JOIN Objetivo AS o ON po.fk_id_objetivo = o.id_objetivo
     WHERE po.fk_id_usuario = ? 
       AND o.fk_id_comunidade = ?
       AND po.data_progresso >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
     GROUP BY dia
     ORDER BY dia ASC;`,
    [idUsuario, idComunidade],
    (error, results) => {
      if (error) {
        console.error("Erro ao buscar evolução diária:", error);
        return res
          .status(500)
          .json({ error: "Erro ao buscar evolução diária" });
      }

      res.status(200).json(results);
    }
  );
}

function indicadoresLeituraUsuario(req, res) {
  const { idUsuario, idComunidade } = req.params;

  const query = `
    SELECT 
      (SELECT DATE(po.data_progresso)
       FROM ProgressoObjetivo po
       JOIN Objetivo o ON po.fk_id_objetivo = o.id_objetivo
       WHERE po.fk_id_usuario = ? AND o.fk_id_comunidade = ?
       GROUP BY po.data_progresso
       ORDER BY SUM(po.paginas_lidas) DESC
       LIMIT 1) AS melhor_dia,

      (SELECT SUM(po.paginas_lidas)
       FROM ProgressoObjetivo po
       JOIN Objetivo o ON po.fk_id_objetivo = o.id_objetivo
       WHERE po.fk_id_usuario = ? AND o.fk_id_comunidade = ?
         AND DATE(po.data_progresso) = CURDATE()) AS total_hoje,

      (SELECT SUM(po.paginas_lidas)
       FROM ProgressoObjetivo po
       JOIN Objetivo o ON po.fk_id_objetivo = o.id_objetivo
       WHERE po.fk_id_usuario = ? AND o.fk_id_comunidade = ?
         AND DATE(po.data_progresso) = CURDATE() - INTERVAL 1 DAY) AS total_ontem,

      (SELECT ROUND(SUM(po.paginas_lidas) / COUNT(DISTINCT po.data_progresso), 1)
       FROM ProgressoObjetivo po
       JOIN Objetivo o ON po.fk_id_objetivo = o.id_objetivo
       WHERE po.fk_id_usuario = ? AND o.fk_id_comunidade = ?
         AND po.data_progresso >= CURDATE() - INTERVAL 60 DAY) AS media_diaria
  `;

  const params = [
    idUsuario,
    idComunidade,
    idUsuario,
    idComunidade,
    idUsuario,
    idComunidade,
    idUsuario,
    idComunidade,
  ];

  connection.query(query, params, (err, results) => {
    if (err) {
      console.error("Erro ao buscar indicadores:", err);
      return res.status(500).json({ error: "Erro ao buscar indicadores." });
    }

    const r = results[0];
    res.status(200).json({
      melhor_dia: r.melhor_dia,
      total_hoje: r.total_hoje || 0,
      total_ontem: r.total_ontem || 0,
      media_diaria: r.media_diaria || 0,
    });
  });
}

module.exports = {
  criarComunidade,
  listarComunidades,
  obterComunidade,
  entrarComunidade,
  listarComentarios,
  adicionarComentario,
  listarProgresso,
  estatisticasIdade,
  registrarProgresso,
  listarComunidadesUsuario,
  listarUsuariosComunidade,
  atualizarStatusUsuario,
  verificarStatusUsuario,
  listarSolicitacoes,
  verificarAdmin,
  criarObjetivo,
  verificarObjetivoAtivo,
  registrarProgressoObjetivo,
  listarProgressoObjetivo,
  obterObjetivoAtivo,
  listarTopLeitores,
  leituraDiariaUsuario,
  indicadoresLeituraUsuario,
};
