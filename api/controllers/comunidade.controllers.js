const connection = require("../config/mysql.config");

function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (error, results) => {
      if (error) return reject(error);
      resolve(results);
    });
  });
}

function toInt(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function normalizarNivel(nivel) {
  const v = String(nivel || "")
    .trim()
    .toLowerCase();

  if (v === "admin") return "admin";
  if (v === "adm" || v === "administrador") return "admin";
  if (v === "moderador") return "auxiliar";
  if (v === "auxiliar") return "auxiliar";
  if (v === "membro") return "membro";
  return "membro";
}

function normalizarTipoMeta(tipo) {
  const v = String(tipo || "")
    .trim()
    .toLowerCase();
  return v === "capitulos" ? "capitulos" : "paginas";
}

function unidadeTexto(tipoMeta, plural = true) {
  if (tipoMeta === "capitulos") return plural ? "capítulos" : "capítulo";
  return plural ? "páginas" : "página";
}

function slugify(text) {
  const base = String(text || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "comunidade";
}

async function gerarSlugUnico(nome, fallbackId = null) {
  const base = slugify(nome);
  let slug = fallbackId ? `${base}-${fallbackId}` : base;
  let tentativa = 1;

  while (true) {
    const exists = await query("SELECT id_comunidade FROM Comunidade WHERE slug = ? LIMIT 1", [slug]);
    if (!exists.length) return slug;
    tentativa += 1;
    slug = `${base}-${tentativa}`;
  }
}

async function obterMembroComunidade(comunidadeId, usuarioId) {
  const rows = await query(
    `SELECT fk_id_usuario, fk_id_comunidade, status, nivel_acesso
     FROM Comunidade_usuario
     WHERE fk_id_comunidade = ? AND fk_id_usuario = ?
     LIMIT 1`,
    [comunidadeId, usuarioId]
  );
  return rows[0] || null;
}

async function usuarioEhGestor(comunidadeId, usuarioId) {
  const membro = await obterMembroComunidade(comunidadeId, usuarioId);
  if (!membro) return false;
  const nivel = normalizarNivel(membro.nivel_acesso);
  return membro.status === "aceito" && (nivel === "admin" || nivel === "auxiliar");
}

async function usuarioEhAdmin(comunidadeId, usuarioId) {
  const membro = await obterMembroComunidade(comunidadeId, usuarioId);
  if (!membro) return false;
  const nivel = normalizarNivel(membro.nivel_acesso);
  return membro.status === "aceito" && nivel === "admin";
}

async function obterObjetivoAtivoDaComunidade(comunidadeId) {
  const rows = await query(
    `SELECT id_objetivo, fk_id_comunidade, titulo, descricao, data_inicio, data_fim,
            total_paginas, tipo_meta, status_desafio, data_encerramento
     FROM Objetivo
     WHERE fk_id_comunidade = ?
       AND status_desafio = 'ativo'
       AND data_fim >= CURDATE()
     ORDER BY data_fim ASC
     LIMIT 1`,
    [comunidadeId]
  );
  return rows[0] || null;
}

async function criarComunidade(req, res) {
  const { nome, descricao, tipo } = req.body;
  const idAdm = toInt(req.user?.id);

  if (!idAdm) return res.status(401).json({ error: "Usuário não autenticado." });
  if (!nome || !String(nome).trim()) {
    return res.status(400).json({ error: "Nome da comunidade é obrigatório." });
  }

  try {
    const slug = await gerarSlugUnico(nome);
    const insert = await query(
      "INSERT INTO Comunidade (nome, descricao, tipo, id_adm, slug) VALUES (?, ?, ?, ?, ?)",
      [String(nome).trim(), descricao || null, tipo || "publica", idAdm, slug]
    );

    const comunidadeId = insert.insertId;

    await query(
      `INSERT INTO Comunidade_usuario (fk_id_comunidade, fk_id_usuario, status, nivel_acesso)
       VALUES (?, ?, 'aceito', 'admin')
       ON DUPLICATE KEY UPDATE status = 'aceito', nivel_acesso = 'admin'`,
      [comunidadeId, idAdm]
    );

    return res.status(201).json({ id: comunidadeId, slug, message: "Comunidade criada!" });
  } catch (error) {
    console.error("Erro ao criar comunidade:", error);
    return res.status(500).json({ error: "Erro ao criar comunidade" });
  }
}

async function listarComunidades(req, res) {
  try {
    const comunidades = await query("SELECT * FROM Comunidade");
    if (!comunidades.length) {
      return res.status(404).json({ message: "Ainda não existem comunidades" });
    }
    return res.json(comunidades);
  } catch (error) {
    console.error("Erro ao listar comunidades:", error);
    return res.status(500).json({ error: "Erro ao listar comunidades" });
  }
}

async function entrarComunidade(req, res) {
  const comunidadeId = toInt(req.params.id);
  const usuarioId = toInt(req.user?.id);

  if (!comunidadeId || !usuarioId) {
    return res.status(400).json({ error: "Dados inválidos para entrada na comunidade." });
  }

  try {
    const comunidadeRows = await query(
      "SELECT id_comunidade, tipo FROM Comunidade WHERE id_comunidade = ? LIMIT 1",
      [comunidadeId]
    );

    if (!comunidadeRows.length) {
      return res.status(404).json({ error: "Comunidade não encontrada." });
    }

    const tipoComunidade = String(comunidadeRows[0].tipo || "publica").toLowerCase();
    const status = tipoComunidade === "publica" ? "aceito" : "pendente";

    const existentes = await query(
      `SELECT id, status FROM Comunidade_usuario
       WHERE fk_id_comunidade = ? AND fk_id_usuario = ?
       LIMIT 1`,
      [comunidadeId, usuarioId]
    );

    if (existentes.length) {
      const atual = existentes[0].status;
      if (atual === "aceito") {
        return res.status(400).json({ message: "Usuário já está na comunidade." });
      }

      await query(
        `UPDATE Comunidade_usuario
         SET status = ?, nivel_acesso = IFNULL(nivel_acesso, 'membro')
         WHERE id = ?`,
        [status, existentes[0].id]
      );

      return res.status(200).json({
        message: status === "aceito" ? "Entrou na comunidade!" : "Solicitação pendente!",
        status,
      });
    }

    await query(
      `INSERT INTO Comunidade_usuario (fk_id_comunidade, fk_id_usuario, status, nivel_acesso)
       VALUES (?, ?, ?, 'membro')`,
      [comunidadeId, usuarioId, status]
    );

    return res.status(200).json({
      message: status === "aceito" ? "Entrou na comunidade!" : "Solicitação pendente!",
      status,
    });
  } catch (error) {
    console.error("Erro ao entrar na comunidade:", error);
    return res.status(500).json({ error: "Erro ao processar a solicitação." });
  }
}

async function listarComunidadesUsuario(req, res) {
  const idUsuarioParam = toInt(req.params.idUsuario);
  const idUsuarioToken = toInt(req.user?.id);

  if (!idUsuarioParam || !idUsuarioToken || idUsuarioParam !== idUsuarioToken) {
    return res.status(403).json({ error: "Sem permissão para acessar comunidades de outro usuário." });
  }

  try {
    const results = await query(
      `SELECT DISTINCT c.id_comunidade, c.nome, c.descricao, c.tipo, c.slug, cu.nivel_acesso
       FROM Comunidade_usuario AS cu
       JOIN Comunidade AS c ON cu.fk_id_comunidade = c.id_comunidade
       WHERE cu.fk_id_usuario = ? AND cu.status = 'aceito'`,
      [idUsuarioParam]
    );

    return res.json(results);
  } catch (error) {
    console.error("Erro ao listar comunidades do usuário:", error);
    return res.status(500).json({ error: "Erro ao listar comunidades do usuário." });
  }
}

async function obterComunidade(req, res) {
  const comunidadeId = toInt(req.params.id);

  try {
    const rows = await query("SELECT * FROM Comunidade WHERE id_comunidade = ?", [comunidadeId]);
    if (!rows.length) {
      return res.status(404).json({ error: "Comunidade não encontrada" });
    }
    return res.json(rows[0]);
  } catch (error) {
    console.error("Erro ao buscar comunidade:", error);
    return res.status(500).json({ error: "Erro ao buscar comunidade" });
  }
}

async function obterComunidadePorSlug(req, res) {
  const slug = String(req.params.slug || "").trim();
  if (!slug) return res.status(400).json({ error: "Slug inválido." });

  try {
    const rows = await query("SELECT * FROM Comunidade WHERE slug = ? LIMIT 1", [slug]);
    if (!rows.length) {
      return res.status(404).json({ error: "Comunidade não encontrada" });
    }
    return res.json(rows[0]);
  } catch (error) {
    console.error("Erro ao buscar comunidade por slug:", error);
    return res.status(500).json({ error: "Erro ao buscar comunidade" });
  }
}

async function listarUsuariosComunidade(req, res) {
  const comunidadeId = toInt(req.params.id || req.params.idComunidade);
  const usuarioAtual = toInt(req.user?.id);

  if (!comunidadeId || !usuarioAtual) {
    return res.status(400).json({ error: "Dados inválidos." });
  }

  try {
    const membro = await obterMembroComunidade(comunidadeId, usuarioAtual);
    if (!membro || membro.status !== "aceito") {
      return res.status(403).json({ error: "Você não participa desta comunidade." });
    }

    const results = await query(
      `SELECT u.id_usuario, u.nome_login, u.email, cu.status, cu.nivel_acesso
       FROM Comunidade_usuario AS cu
       JOIN Usuario AS u ON cu.fk_id_usuario = u.id_usuario
       WHERE cu.fk_id_comunidade = ?
       ORDER BY cu.status = 'pendente' DESC, cu.nivel_acesso DESC, u.nome_login ASC`,
      [comunidadeId]
    );

    return res.status(200).json(results);
  } catch (error) {
    console.error("Erro ao listar usuários da comunidade:", error);
    return res.status(500).json({ error: "Erro ao listar usuários." });
  }
}

async function listarParticipantes(req, res) {
  const comunidadeId = toInt(req.params.idComunidade);

  try {
    const participants = await query(
      `SELECT u.id_usuario, u.nome_login, cu.nivel_acesso
       FROM Comunidade_usuario cu
       JOIN Usuario u ON u.id_usuario = cu.fk_id_usuario
       WHERE cu.fk_id_comunidade = ?
         AND cu.status = 'aceito'
       ORDER BY FIELD(cu.nivel_acesso, 'admin', 'auxiliar', 'membro'), u.nome_login ASC`,
      [comunidadeId]
    );

    return res.status(200).json(participants);
  } catch (error) {
    console.error("Erro ao listar participantes:", error);
    return res.status(500).json({ error: "Erro ao listar participantes." });
  }
}

async function verificarAdmin(req, res) {
  const comunidadeId = toInt(req.params.id);
  const userToken = toInt(req.user?.id);

  if (!comunidadeId || !userToken) {
    return res.status(403).json({ isAdmin: false });
  }

  try {
    let membro = await obterMembroComunidade(comunidadeId, userToken);

    if (!membro) {
      const comunidadeRows = await query(
        "SELECT id_adm FROM Comunidade WHERE id_comunidade = ? LIMIT 1",
        [comunidadeId]
      );
      const idAdmCriador = toInt(comunidadeRows[0]?.id_adm);

      if (idAdmCriador && idAdmCriador === userToken) {
        await query(
          `INSERT INTO Comunidade_usuario (fk_id_comunidade, fk_id_usuario, status, nivel_acesso)
           VALUES (?, ?, 'aceito', 'admin')
           ON DUPLICATE KEY UPDATE status = 'aceito', nivel_acesso = 'admin'`,
          [comunidadeId, userToken]
        );
        membro = await obterMembroComunidade(comunidadeId, userToken);
      }
    }

    const nivel = normalizarNivel(membro?.nivel_acesso || "membro");
    const canManage = Boolean(membro && membro.status === "aceito" && (nivel === "admin" || nivel === "auxiliar"));
    return res.status(200).json({
      isAdmin: canManage,
      nivelAcesso: nivel,
      status: membro?.status || "nao_inscrito",
    });
  } catch (error) {
    console.error("Erro ao verificar admin:", error);
    return res.status(500).json({ error: "Erro ao verificar administrador." });
  }
}

async function atualizarStatusUsuario(req, res) {
  const comunidadeId = toInt(req.params.comunidadeId);
  const idUsuarioAlvo = toInt(req.params.idUsuario);
  const idUsuarioAtual = toInt(req.user?.id);
  const status = String(req.body.status || "").trim().toLowerCase();

  if (!comunidadeId || !idUsuarioAlvo || !idUsuarioAtual) {
    return res.status(400).json({ error: "Parâmetros inválidos." });
  }

  if (!["aceito", "pendente", "rejeitado"].includes(status)) {
    return res.status(400).json({ error: "Status inválido." });
  }

  try {
    const podeGerenciar = await usuarioEhGestor(comunidadeId, idUsuarioAtual);
    if (!podeGerenciar) {
      return res.status(403).json({ error: "Sem permissão para gerenciar usuários." });
    }

    const comunidadeRows = await query(
      "SELECT id_adm FROM Comunidade WHERE id_comunidade = ? LIMIT 1",
      [comunidadeId]
    );
    const idAdmCriador = toInt(comunidadeRows[0]?.id_adm);

    if (idUsuarioAlvo === idAdmCriador && status !== "aceito") {
      return res.status(400).json({ error: "Não é possível remover o administrador criador." });
    }

    const update = await query(
      `UPDATE Comunidade_usuario
       SET status = ?,
           nivel_acesso = CASE
             WHEN ? <> 'aceito' THEN 'membro'
             WHEN nivel_acesso IS NULL OR TRIM(nivel_acesso) = '' THEN 'membro'
             ELSE nivel_acesso
           END
       WHERE fk_id_comunidade = ? AND fk_id_usuario = ?`,
      [status, status, comunidadeId, idUsuarioAlvo]
    );

    if (update.affectedRows === 0) {
      return res.status(404).json({ message: "Usuário ou comunidade não encontrado" });
    }

    return res.status(200).json({ message: "Status atualizado com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar status do usuário:", error);
    return res.status(500).json({ error: "Erro ao atualizar status do usuário" });
  }
}

async function atualizarNivelUsuario(req, res) {
  const comunidadeId = toInt(req.params.comunidadeId);
  const idUsuarioAlvo = toInt(req.params.idUsuario);
  const idUsuarioAtual = toInt(req.user?.id);
  const novoNivel = normalizarNivel(req.body.nivel_acesso);

  if (!comunidadeId || !idUsuarioAlvo || !idUsuarioAtual) {
    return res.status(400).json({ error: "Parâmetros inválidos." });
  }

  try {
    const ehAdmin = await usuarioEhAdmin(comunidadeId, idUsuarioAtual);
    if (!ehAdmin) {
      return res.status(403).json({ error: "Apenas admin da comunidade pode alterar níveis." });
    }

    const comunidadeRows = await query(
      "SELECT id_adm FROM Comunidade WHERE id_comunidade = ? LIMIT 1",
      [comunidadeId]
    );
    const idAdmCriador = toInt(comunidadeRows[0]?.id_adm);

    if (idUsuarioAlvo === idAdmCriador && novoNivel !== "admin") {
      return res.status(400).json({ error: "Não é possível rebaixar o administrador criador." });
    }

    const updated = await query(
      `UPDATE Comunidade_usuario
       SET nivel_acesso = ?
       WHERE fk_id_comunidade = ?
         AND fk_id_usuario = ?
         AND status = 'aceito'`,
      [novoNivel, comunidadeId, idUsuarioAlvo]
    );

    if (updated.affectedRows === 0) {
      return res.status(404).json({ error: "Participante não encontrado ou ainda não aceito." });
    }

    return res.status(200).json({ message: "Nível atualizado com sucesso." });
  } catch (error) {
    console.error("Erro ao atualizar nível do usuário:", error);
    return res.status(500).json({ error: "Erro ao atualizar nível do usuário." });
  }
}

async function listarSolicitacoes(req, res) {
  const comunidadeId = toInt(req.params.idComunidade);
  const usuarioAtual = toInt(req.user?.id);

  try {
    const podeGerenciar = await usuarioEhGestor(comunidadeId, usuarioAtual);
    if (!podeGerenciar) {
      return res.status(403).json({ error: "Sem permissão para listar solicitações." });
    }

    const results = await query(
      `SELECT cu.fk_id_usuario AS id_usuario,
              u.nome_login AS nome_usuario,
              cu.status,
              cu.nivel_acesso
       FROM Comunidade_usuario AS cu
       JOIN Usuario AS u ON cu.fk_id_usuario = u.id_usuario
       WHERE cu.fk_id_comunidade = ? AND cu.status = 'pendente'`,
      [comunidadeId]
    );

    return res.status(200).json(results);
  } catch (error) {
    console.error("Erro ao listar solicitações:", error);
    return res.status(500).json({ error: "Erro ao listar solicitações." });
  }
}

async function sairComunidade(req, res) {
  const comunidadeId = toInt(req.params.idComunidade);
  const usuarioAtual = toInt(req.user?.id);
  if (!comunidadeId || !usuarioAtual) {
    return res.status(400).json({ error: "Parâmetros inválidos." });
  }

  try {
    const comunidadeRows = await query(
      "SELECT id_adm FROM Comunidade WHERE id_comunidade = ? LIMIT 1",
      [comunidadeId]
    );
    if (!comunidadeRows.length) {
      return res.status(404).json({ error: "Comunidade não encontrada." });
    }

    const idAdmCriador = toInt(comunidadeRows[0].id_adm);
    const membroRows = await query(
      `SELECT id, status, nivel_acesso
       FROM Comunidade_usuario
       WHERE fk_id_comunidade = ? AND fk_id_usuario = ?
       LIMIT 1`,
      [comunidadeId, usuarioAtual]
    );

    if (!membroRows.length) {
      return res.status(404).json({ error: "Você não faz parte desta comunidade." });
    }

    if (usuarioAtual === idAdmCriador) {
      const outrosAdmins = await query(
        `SELECT fk_id_usuario
         FROM Comunidade_usuario
         WHERE fk_id_comunidade = ?
           AND fk_id_usuario <> ?
           AND status = 'aceito'
           AND nivel_acesso = 'admin'
         LIMIT 1`,
        [comunidadeId, usuarioAtual]
      );

      if (!outrosAdmins.length) {
        return res.status(400).json({
          error:
            "Você é o administrador criador. Promova outro admin antes de sair ou exclua a comunidade.",
        });
      }
    }

    await query(
      "DELETE FROM Comunidade_usuario WHERE fk_id_comunidade = ? AND fk_id_usuario = ?",
      [comunidadeId, usuarioAtual]
    );

    return res.status(200).json({ message: "Você saiu da comunidade." });
  } catch (error) {
    console.error("Erro ao sair da comunidade:", error);
    return res.status(500).json({ error: "Erro ao sair da comunidade." });
  }
}

async function excluirComunidade(req, res) {
  const comunidadeId = toInt(req.params.idComunidade);
  const usuarioAtual = toInt(req.user?.id);
  if (!comunidadeId || !usuarioAtual) {
    return res.status(400).json({ error: "Parâmetros inválidos." });
  }

  try {
    const rows = await query(
      "SELECT id_comunidade, id_adm FROM Comunidade WHERE id_comunidade = ? LIMIT 1",
      [comunidadeId]
    );
    if (!rows.length) {
      return res.status(404).json({ error: "Comunidade não encontrada." });
    }

    if (toInt(rows[0].id_adm) !== usuarioAtual) {
      return res.status(403).json({ error: "Apenas o admin criador pode excluir a comunidade." });
    }

    const comentariosComunidade = await query(
      `SELECT fk_id_comentario
       FROM Comentarios_Comunidade
       WHERE fk_id_comunidade = ?`,
      [comunidadeId]
    );
    const comentarioIds = comentariosComunidade.map((row) => Number(row.fk_id_comentario)).filter(Boolean);

    await query(
      `DELETE po FROM ProgressoObjetivo po
       JOIN Objetivo o ON o.id_objetivo = po.fk_id_objetivo
       WHERE o.fk_id_comunidade = ?`,
      [comunidadeId]
    );
    await query("DELETE FROM Objetivo WHERE fk_id_comunidade = ?", [comunidadeId]);
    await query(
      `DELETE cv FROM Comentarios_vistos cv
       JOIN Comentarios c ON c.id_comentario = cv.fk_id_comentario
       JOIN Comentarios_Comunidade cc ON cc.fk_id_comentario = c.id_comentario
       WHERE cc.fk_id_comunidade = ?`,
      [comunidadeId]
    );
    await query(
      `DELETE cu FROM Comentarios_usuario cu
       JOIN Comentarios_Comunidade cc ON cc.fk_id_comentario = cu.fk_id_comentario
       WHERE cc.fk_id_comunidade = ?`,
      [comunidadeId]
    );
    await query("DELETE FROM Comentarios_Comunidade WHERE fk_id_comunidade = ?", [comunidadeId]);

    if (comentarioIds.length) {
      await query(
        `DELETE c FROM Comentarios c
         LEFT JOIN Comentarios_livro cl ON cl.fk_id_comentario = c.id_comentario
         WHERE c.id_comentario IN (?)
           AND cl.fk_id_comentario IS NULL`,
        [comentarioIds]
      );
    }

    await query("DELETE FROM Comunidade_usuario WHERE fk_id_comunidade = ?", [comunidadeId]);
    await query("DELETE FROM Comunidade WHERE id_comunidade = ?", [comunidadeId]);

    return res.status(200).json({ message: "Comunidade excluída com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir comunidade:", error);
    return res.status(500).json({ error: "Erro ao excluir comunidade." });
  }
}

async function listarComentarios(req, res) {
  const comunidadeId = toInt(req.params.id);
  const usuarioAtual = toInt(req.user?.id) || -1;

  try {
    const resultados = await query(
      `SELECT c.*,
              u.nome_login AS nome_usuario,
              u.foto_usuario AS foto_usuario,
              cu.fk_id_usuario,
              c.reply_to,
              (SELECT COUNT(*) FROM Comentarios_vistos cv WHERE cv.fk_id_comentario = c.id_comentario) AS vistos_total,
              (SELECT COUNT(*) FROM Comentarios_vistos cv WHERE cv.fk_id_comentario = c.id_comentario AND cv.fk_id_usuario = ?) AS visto_por_mim
       FROM Comentarios AS c
       JOIN Comentarios_Comunidade AS cc ON cc.fk_id_comentario = c.id_comentario
       JOIN Comentarios_usuario AS cu ON cu.fk_id_comentario = c.id_comentario
       JOIN Usuario AS u ON cu.fk_id_usuario = u.id_usuario
       WHERE cc.fk_id_comunidade = ?
       ORDER BY c.data_comentario ASC, c.id_comentario ASC`,
      [usuarioAtual, comunidadeId]
    );

    const comentarioIds = resultados.map((r) => r.id_comentario);
    const vistosPreviewMap = {};
    if (comentarioIds.length) {
      const vistosRows = await query(
        `SELECT cv.fk_id_comentario, cv.visto_em, u.nome_login, u.foto_usuario
         FROM Comentarios_vistos cv
         JOIN Usuario u ON u.id_usuario = cv.fk_id_usuario
         WHERE cv.fk_id_comentario IN (?)
         ORDER BY cv.visto_em DESC`,
        [comentarioIds]
      );

      vistosRows.forEach((row) => {
        const key = row.fk_id_comentario;
        if (!vistosPreviewMap[key]) vistosPreviewMap[key] = [];
        if (vistosPreviewMap[key].length < 2) {
          vistosPreviewMap[key].push({
            nome_usuario: row.nome_login,
            foto_usuario: row.foto_usuario
              ? `data:image/jpeg;base64,${Buffer.from(row.foto_usuario).toString("base64")}`
              : null,
            visto_em: row.visto_em,
          });
        }
      });
    }

    const resultadosConvertidos = resultados.map((comentario) => ({
      ...comentario,
      foto_usuario: comentario.foto_usuario
        ? `data:image/jpeg;base64,${Buffer.from(comentario.foto_usuario).toString("base64")}`
        : null,
      vistos_total: Number(comentario.vistos_total || 0),
      visto_por_mim: Number(comentario.visto_por_mim || 0) > 0,
      vistos_preview: vistosPreviewMap[comentario.id_comentario] || [],
    }));

    return res.json(resultadosConvertidos);
  } catch (error) {
    console.error("Erro ao listar comentários da comunidade:", error);
    return res.status(500).json({ error: "Erro ao listar comentários da comunidade" });
  }
}

async function adicionarComentario(req, res) {
  const comunidadeId = toInt(req.params.id);
  const fk_id_usuario = toInt(req.user?.id);
  const comentario = String(req.body.comentario || "").trim();
  const replyTo = toInt(req.body.reply_to);

  if (!comunidadeId || !fk_id_usuario || !comentario) {
    return res.status(400).json({ error: "Comentário é obrigatório." });
  }

  try {
    const membro = await obterMembroComunidade(comunidadeId, fk_id_usuario);
    if (!membro || membro.status !== "aceito") {
      return res.status(403).json({ error: "Você não participa desta comunidade." });
    }

    if (replyTo) {
      const existePai = await query(
        `SELECT c.id_comentario
         FROM Comentarios c
         JOIN Comentarios_Comunidade cc ON cc.fk_id_comentario = c.id_comentario
         WHERE c.id_comentario = ? AND cc.fk_id_comunidade = ?
         LIMIT 1`,
        [replyTo, comunidadeId]
      );
      if (!existePai.length) {
        return res.status(404).json({ error: "Comentário original não encontrado para resposta." });
      }
    }

    const comentarioResult = await query(
      "INSERT INTO Comentarios (comentario, data_comentario, reply_to) VALUES (?, NOW(), ?)",
      [comentario, replyTo || null]
    );

    const comentarioId = comentarioResult.insertId;

    await query(
      "INSERT INTO Comentarios_Comunidade (fk_id_comentario, fk_id_comunidade) VALUES (?, ?)",
      [comentarioId, comunidadeId]
    );

    await query(
      "INSERT INTO Comentarios_usuario (fk_id_comentario, fk_id_usuario) VALUES (?, ?)",
      [comentarioId, fk_id_usuario]
    );

    return res.status(201).json({
      id: comentarioId,
      reply_to: replyTo || null,
      message: "Comentário adicionado com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao adicionar comentário:", error);
    return res.status(500).json({ error: "Erro ao adicionar comentário" });
  }
}

async function marcarComentarioVisto(req, res) {
  const comunidadeId = toInt(req.params.id);
  const comentarioId = toInt(req.params.idComentario);
  const usuarioAtual = toInt(req.user?.id);
  if (!comunidadeId || !comentarioId || !usuarioAtual) {
    return res.status(400).json({ error: "Parâmetros inválidos." });
  }

  try {
    const membro = await obterMembroComunidade(comunidadeId, usuarioAtual);
    if (!membro || membro.status !== "aceito") {
      return res.status(403).json({ error: "Você não participa desta comunidade." });
    }

    const existeComentario = await query(
      `SELECT c.id_comentario
       FROM Comentarios c
       JOIN Comentarios_Comunidade cc ON cc.fk_id_comentario = c.id_comentario
       WHERE c.id_comentario = ? AND cc.fk_id_comunidade = ?
       LIMIT 1`,
      [comentarioId, comunidadeId]
    );
    if (!existeComentario.length) {
      return res.status(404).json({ error: "Comentário não encontrado." });
    }

    await query(
      `INSERT INTO Comentarios_vistos (fk_id_comentario, fk_id_usuario, visto_em)
       VALUES (?, ?, NOW())
       ON DUPLICATE KEY UPDATE visto_em = NOW()`,
      [comentarioId, usuarioAtual]
    );
    return res.status(200).json({ message: "Leitura registrada." });
  } catch (error) {
    console.error("Erro ao marcar comentário como visto:", error);
    return res.status(500).json({ error: "Erro ao registrar leitura da mensagem." });
  }
}

async function listarVistosComentario(req, res) {
  const comunidadeId = toInt(req.params.id);
  const comentarioId = toInt(req.params.idComentario);
  const usuarioAtual = toInt(req.user?.id);
  if (!comunidadeId || !comentarioId || !usuarioAtual) {
    return res.status(400).json({ error: "Parâmetros inválidos." });
  }

  try {
    const membro = await obterMembroComunidade(comunidadeId, usuarioAtual);
    if (!membro || membro.status !== "aceito") {
      return res.status(403).json({ error: "Você não participa desta comunidade." });
    }

    const rows = await query(
      `SELECT u.id_usuario, u.nome_login, u.foto_usuario, cv.visto_em
       FROM Comentarios_vistos cv
       JOIN Usuario u ON u.id_usuario = cv.fk_id_usuario
       WHERE cv.fk_id_comentario = ?
       ORDER BY cv.visto_em DESC`,
      [comentarioId]
    );

    return res.status(200).json(
      rows.map((r) => ({
        id_usuario: r.id_usuario,
        nome_usuario: r.nome_login,
        foto_usuario: r.foto_usuario
          ? `data:image/jpeg;base64,${Buffer.from(r.foto_usuario).toString("base64")}`
          : null,
        visto_em: r.visto_em,
      }))
    );
  } catch (error) {
    console.error("Erro ao listar vistos do comentário:", error);
    return res.status(500).json({ error: "Erro ao listar visualizações." });
  }
}

async function verificarStatusUsuario(req, res) {
  const { idComunidade, idUsuario } = req.params;

  try {
    const results = await query(
      `SELECT status
       FROM Comunidade_usuario
       WHERE fk_id_comunidade = ? AND fk_id_usuario = ?`,
      [idComunidade, idUsuario]
    );

    if (results.length === 0) {
      return res.status(200).json({ status: "nao_inscrito" });
    }

    return res.status(200).json({ status: results[0].status });
  } catch (error) {
    console.error("Erro ao verificar status do usuário:", error);
    return res.status(500).json({ error: "Erro ao verificar status do usuário" });
  }
}

async function registrarProgresso(req, res) {
  const comunidadeId = toInt(req.params.id);
  const fk_id_usuario = toInt(req.user?.id);
  const paginas_lidas = toInt(req.body.paginas_lidas);

  if (!comunidadeId || !fk_id_usuario || !paginas_lidas || paginas_lidas <= 0) {
    return res.status(400).json({ error: "Dados inválidos para registrar progresso." });
  }

  try {
    await query(
      "INSERT INTO Progresso (fk_id_usuario, fk_id_comunidade, paginas_lidas, data) VALUES (?, ?, ?, NOW())",
      [fk_id_usuario, comunidadeId, paginas_lidas]
    );
    return res.status(201).json({ message: "Progresso registrado!" });
  } catch (error) {
    console.error("Erro ao registrar progresso:", error);
    return res.status(500).json({ error: "Erro ao registrar progresso" });
  }
}

async function listarProgresso(req, res) {
  const comunidadeId = toInt(req.params.id);

  try {
    const results = await query(
      `SELECT u.nome_login AS nome_usuario, SUM(p.paginas_lidas) AS paginas_lidas
       FROM Progresso AS p
       JOIN Usuario AS u ON p.fk_id_usuario = u.id_usuario
       WHERE p.fk_id_comunidade = ?
       GROUP BY u.nome_login
       ORDER BY paginas_lidas DESC`,
      [comunidadeId]
    );

    return res.json(results);
  } catch (error) {
    console.error("Erro ao buscar progresso:", error);
    return res.status(500).json({ error: "Erro ao buscar progresso" });
  }
}

async function estatisticasIdade(req, res) {
  const comunidadeId = toInt(req.params.id);

  try {
    const results = await query(
      `SELECT
         CASE
           WHEN TIMESTAMPDIFF(YEAR, u.data_nascimento, CURDATE()) < 18 THEN 'Menor de 18'
           WHEN TIMESTAMPDIFF(YEAR, u.data_nascimento, CURDATE()) BETWEEN 18 AND 24 THEN '18-24'
           WHEN TIMESTAMPDIFF(YEAR, u.data_nascimento, CURDATE()) BETWEEN 25 AND 34 THEN '25-34'
           WHEN TIMESTAMPDIFF(YEAR, u.data_nascimento, CURDATE()) BETWEEN 35 AND 44 THEN '35-44'
           ELSE '45+'
         END AS faixa_etaria,
         COUNT(DISTINCT cu.fk_id_usuario) AS quantidade,
         COALESCE(SUM(DISTINCT p.paginas_lidas), 0) AS paginas_lidas
       FROM Comunidade_usuario AS cu
       JOIN Usuario AS u ON cu.fk_id_usuario = u.id_usuario
       JOIN Comunidade AS co ON cu.fk_id_comunidade = co.id_comunidade
       LEFT JOIN Progresso AS p
         ON cu.fk_id_usuario = p.fk_id_usuario
         AND cu.fk_id_comunidade = p.fk_id_comunidade
       WHERE cu.fk_id_comunidade = ? AND cu.status = 'aceito'
       GROUP BY faixa_etaria`,
      [comunidadeId]
    );

    return res.json(results);
  } catch (error) {
    console.error("Erro ao buscar estatísticas de idade:", error);
    return res.status(500).json({ error: "Erro ao buscar estatísticas de idade" });
  }
}

async function criarObjetivo(req, res) {
  const {
    fk_id_comunidade,
    titulo,
    descricao,
    data_inicio,
    data_fim,
    total_paginas,
    tipo_meta,
  } = req.body;

  const comunidadeId = toInt(fk_id_comunidade);
  const usuarioAtual = toInt(req.user?.id);
  const total = toInt(total_paginas);
  const tipoMeta = normalizarTipoMeta(tipo_meta);

  if (!comunidadeId || !titulo || !data_inicio || !data_fim || !total || total <= 0) {
    return res.status(400).json({ error: "Preencha corretamente os dados do objetivo." });
  }

  if (String(data_inicio) > String(data_fim)) {
    return res.status(400).json({ error: "Data inicial não pode ser maior que a data final." });
  }

  try {
    const podeGerenciar = await usuarioEhGestor(comunidadeId, usuarioAtual);
    if (!podeGerenciar) {
      return res.status(403).json({ error: "Sem permissão para criar objetivo." });
    }

    const ativo = await obterObjetivoAtivoDaComunidade(comunidadeId);
    if (ativo) {
      return res.status(400).json({
        error: "Já existe um objetivo em andamento para esta comunidade.",
      });
    }

    const insert = await query(
      `INSERT INTO Objetivo (
        fk_id_comunidade, titulo, descricao, data_inicio, data_fim,
        total_paginas, tipo_meta, status_desafio
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ativo')`,
      [comunidadeId, titulo, descricao || null, data_inicio, data_fim, total, tipoMeta]
    );

    return res.status(201).json({
      id: insert.insertId,
      message: "Objetivo criado com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao criar objetivo:", error);
    return res.status(500).json({ error: "Erro ao criar objetivo" });
  }
}

async function editarObjetivo(req, res) {
  const idObjetivo = toInt(req.params.idObjetivo);
  const usuarioAtual = toInt(req.user?.id);
  const {
    titulo,
    descricao,
    data_inicio,
    data_fim,
    total_paginas,
    tipo_meta,
  } = req.body;

  if (!idObjetivo || !usuarioAtual) {
    return res.status(400).json({ error: "Parâmetros inválidos." });
  }

  const totalMeta = toInt(total_paginas);
  const tipoMeta = normalizarTipoMeta(tipo_meta);

  if (!titulo || !data_inicio || !data_fim || !totalMeta || totalMeta <= 0) {
    return res.status(400).json({ error: "Preencha corretamente os dados do objetivo." });
  }

  if (String(data_inicio) > String(data_fim)) {
    return res.status(400).json({ error: "Data inicial não pode ser maior que a data final." });
  }

  try {
    const objetivoRows = await query(
      `SELECT id_objetivo, fk_id_comunidade, status_desafio
       FROM Objetivo
       WHERE id_objetivo = ?
       LIMIT 1`,
      [idObjetivo]
    );

    if (!objetivoRows.length) {
      return res.status(404).json({ error: "Objetivo não encontrado." });
    }

    const objetivo = objetivoRows[0];
    const podeGerenciar = await usuarioEhGestor(objetivo.fk_id_comunidade, usuarioAtual);
    if (!podeGerenciar) {
      return res.status(403).json({ error: "Sem permissão para editar objetivo." });
    }

    if (objetivo.status_desafio === "finalizado") {
      return res.status(400).json({ error: "Não é possível editar um objetivo finalizado." });
    }

    await query(
      `UPDATE Objetivo
       SET titulo = ?,
           descricao = ?,
           data_inicio = ?,
           data_fim = ?,
           total_paginas = ?,
           tipo_meta = ?
       WHERE id_objetivo = ?`,
      [titulo, descricao || null, data_inicio, data_fim, totalMeta, tipoMeta, idObjetivo]
    );

    return res.status(200).json({ message: "Objetivo atualizado com sucesso." });
  } catch (error) {
    console.error("Erro ao editar objetivo:", error);
    return res.status(500).json({ error: "Erro ao editar objetivo." });
  }
}

async function finalizarObjetivo(req, res) {
  const idObjetivo = toInt(req.params.idObjetivo);
  const usuarioAtual = toInt(req.user?.id);

  if (!idObjetivo || !usuarioAtual) {
    return res.status(400).json({ error: "Parâmetros inválidos." });
  }

  try {
    const rows = await query(
      `SELECT id_objetivo, fk_id_comunidade, status_desafio
       FROM Objetivo
       WHERE id_objetivo = ?
       LIMIT 1`,
      [idObjetivo]
    );

    if (!rows.length) {
      return res.status(404).json({ error: "Objetivo não encontrado." });
    }

    const objetivo = rows[0];
    const podeGerenciar = await usuarioEhGestor(objetivo.fk_id_comunidade, usuarioAtual);
    if (!podeGerenciar) {
      return res.status(403).json({ error: "Sem permissão para finalizar objetivo." });
    }

    if (objetivo.status_desafio === "finalizado") {
      return res.status(200).json({ message: "Objetivo já estava finalizado." });
    }

    await query(
      `UPDATE Objetivo
       SET status_desafio = 'finalizado',
           data_encerramento = NOW()
       WHERE id_objetivo = ?`,
      [idObjetivo]
    );

    return res.status(200).json({ message: "Objetivo finalizado com sucesso." });
  } catch (error) {
    console.error("Erro ao finalizar objetivo:", error);
    return res.status(500).json({ error: "Erro ao finalizar objetivo." });
  }
}

async function verificarObjetivoAtivo(req, res) {
  const comunidadeId = toInt(req.params.idComunidade);

  try {
    const ativo = await obterObjetivoAtivoDaComunidade(comunidadeId);
    return res.status(200).json({
      ativo: Boolean(ativo),
      objetivo: ativo
        ? {
            id_objetivo: ativo.id_objetivo,
            titulo: ativo.titulo,
            descricao: ativo.descricao,
            data_inicio: ativo.data_inicio,
            data_fim: ativo.data_fim,
            total_meta: ativo.total_paginas,
            tipo_meta: ativo.tipo_meta,
            unidade_label: unidadeTexto(ativo.tipo_meta, true),
          }
        : null,
    });
  } catch (error) {
    console.error("Erro ao verificar objetivo ativo:", error);
    return res.status(500).json({ error: "Erro ao verificar objetivo ativo." });
  }
}

async function obterObjetivoAtivo(req, res) {
  const comunidadeId = toInt(req.params.idComunidade);

  try {
    const objetivo = await obterObjetivoAtivoDaComunidade(comunidadeId);

    if (!objetivo) {
      return res.status(200).json({ idObjetivo: null, objetivo: null });
    }

    return res.status(200).json({
      idObjetivo: objetivo.id_objetivo,
      objetivo: {
        id_objetivo: objetivo.id_objetivo,
        titulo: objetivo.titulo,
        descricao: objetivo.descricao,
        data_inicio: objetivo.data_inicio,
        data_fim: objetivo.data_fim,
        total_meta: objetivo.total_paginas,
        tipo_meta: objetivo.tipo_meta,
        unidade_label: unidadeTexto(objetivo.tipo_meta, true),
        status_desafio: objetivo.status_desafio,
      },
    });
  } catch (error) {
    console.error("Erro ao buscar objetivo ativo:", error);
    return res.status(500).json({ error: "Erro ao buscar objetivo ativo" });
  }
}

async function registrarProgressoObjetivo(req, res) {
  const idComunidade = toInt(req.params.idComunidade);
  const fk_id_usuario = toInt(req.user?.id);
  const paginas_lidas = toInt(req.body.paginas_lidas);

  if (!idComunidade || !fk_id_usuario || !paginas_lidas || paginas_lidas <= 0) {
    return res.status(400).json({ error: "ID do usuário ou quantidade inválida." });
  }

  try {
    const membro = await obterMembroComunidade(idComunidade, fk_id_usuario);
    if (!membro || membro.status !== "aceito") {
      return res.status(403).json({ error: "Você não participa desta comunidade." });
    }

    const objetivoAtivo = await obterObjetivoAtivoDaComunidade(idComunidade);

    if (!objetivoAtivo) {
      return res.status(404).json({ error: "Nenhum objetivo ativo encontrado para esta comunidade." });
    }

    const fk_id_objetivo = objetivoAtivo.id_objetivo;
    const totalMeta = toInt(objetivoAtivo.total_paginas) || 0;

    const sumResults = await query(
      `SELECT COALESCE(SUM(paginas_lidas), 0) AS paginas_lidas
       FROM ProgressoObjetivo
       WHERE fk_id_objetivo = ? AND fk_id_usuario = ?`,
      [fk_id_objetivo, fk_id_usuario]
    );

    const paginasTotais = toInt(sumResults[0]?.paginas_lidas) || 0;
    const novasPaginasTotais = paginasTotais + paginas_lidas;

    if (novasPaginasTotais > totalMeta) {
      return res.status(400).json({
        error: `A quantidade inserida ultrapassa o total permitido (${totalMeta} ${unidadeTexto(objetivoAtivo.tipo_meta, true)}).`,
      });
    }

    await query(
      `INSERT INTO ProgressoObjetivo (fk_id_objetivo, fk_id_usuario, paginas_lidas, data_progresso)
       VALUES (?, ?, ?, CURDATE())`,
      [fk_id_objetivo, fk_id_usuario, paginas_lidas]
    );

    return res.status(201).json({
      message: "Progresso atualizado com sucesso!",
      paginas_inseridas: paginas_lidas,
      total_usuario: novasPaginasTotais,
      total_objetivo: totalMeta,
      tipo_meta: objetivoAtivo.tipo_meta,
      objetivo_concluido_usuario: novasPaginasTotais >= totalMeta,
    });
  } catch (error) {
    console.error("Erro ao registrar progresso:", error);
    return res.status(500).json({ error: "Erro ao registrar progresso." });
  }
}

async function listarProgressoObjetivo(req, res) {
  const id_objetivo = toInt(req.params.id_objetivo);

  try {
    const results = await query(
      `SELECT u.nome_login,
              SUM(p.paginas_lidas) AS paginas_lidas,
              o.total_paginas,
              o.tipo_meta,
              o.titulo
       FROM ProgressoObjetivo p
       JOIN Usuario u ON p.fk_id_usuario = u.id_usuario
       JOIN Objetivo o ON p.fk_id_objetivo = o.id_objetivo
       WHERE p.fk_id_objetivo = ?
       GROUP BY u.id_usuario, u.nome_login, o.total_paginas, o.tipo_meta, o.titulo
       ORDER BY paginas_lidas DESC`,
      [id_objetivo]
    );

    return res.json(results);
  } catch (error) {
    console.error("Erro ao buscar progresso:", error);
    return res.status(500).json({ error: "Erro ao buscar progresso" });
  }
}

async function listarTopLeitores(req, res) {
  const comunidadeId = toInt(req.params.id);

  try {
    const results = await query(
      `SELECT u.nome_login AS nome_usuario, u.foto_usuario, SUM(p.paginas_lidas) AS paginas_lidas
       FROM ProgressoObjetivo AS p
       JOIN Usuario AS u ON p.fk_id_usuario = u.id_usuario
       JOIN Objetivo AS o ON o.id_objetivo = p.fk_id_objetivo
       WHERE o.fk_id_comunidade = ?
       GROUP BY u.id_usuario
       ORDER BY paginas_lidas DESC
       LIMIT 10`,
      [comunidadeId]
    );

    const convertidos = results.map((usuario) => ({
      ...usuario,
      foto_usuario: usuario.foto_usuario
        ? `data:image/jpeg;base64,${Buffer.from(usuario.foto_usuario).toString("base64")}`
        : null,
    }));

    return res.json(convertidos);
  } catch (error) {
    console.error("Erro ao buscar top leitores:", error);
    return res.status(500).json({ error: "Erro ao buscar top leitores" });
  }
}

async function leituraDiariaUsuario(req, res) {
  const { idUsuario, idComunidade } = req.params;

  try {
    const results = await query(
      `SELECT DATE(po.data_progresso) AS dia, SUM(po.paginas_lidas) AS total
       FROM ProgressoObjetivo AS po
       JOIN Objetivo AS o ON po.fk_id_objetivo = o.id_objetivo
       WHERE po.fk_id_usuario = ?
         AND o.fk_id_comunidade = ?
         AND po.data_progresso >= DATE_SUB(CURDATE(), INTERVAL 60 DAY)
       GROUP BY dia
       ORDER BY dia ASC`,
      [idUsuario, idComunidade]
    );

    return res.status(200).json(results);
  } catch (error) {
    console.error("Erro ao buscar evolução diária:", error);
    return res.status(500).json({ error: "Erro ao buscar evolução diária" });
  }
}

async function indicadoresLeituraUsuario(req, res) {
  const { idUsuario, idComunidade } = req.params;

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

  try {
    const results = await query(
      `SELECT
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
            AND po.data_progresso >= CURDATE() - INTERVAL 60 DAY) AS media_diaria`,
      params
    );

    const r = results[0] || {};
    return res.status(200).json({
      melhor_dia: r.melhor_dia,
      total_hoje: r.total_hoje || 0,
      total_ontem: r.total_ontem || 0,
      media_diaria: r.media_diaria || 0,
    });
  } catch (error) {
    console.error("Erro ao buscar indicadores:", error);
    return res.status(500).json({ error: "Erro ao buscar indicadores." });
  }
}

module.exports = {
  criarComunidade,
  listarComunidades,
  obterComunidade,
  obterComunidadePorSlug,
  entrarComunidade,
  listarComentarios,
  adicionarComentario,
  marcarComentarioVisto,
  listarVistosComentario,
  listarProgresso,
  estatisticasIdade,
  registrarProgresso,
  listarComunidadesUsuario,
  listarUsuariosComunidade,
  listarParticipantes,
  atualizarStatusUsuario,
  atualizarNivelUsuario,
  verificarStatusUsuario,
  listarSolicitacoes,
  sairComunidade,
  excluirComunidade,
  verificarAdmin,
  criarObjetivo,
  editarObjetivo,
  verificarObjetivoAtivo,
  obterObjetivoAtivo,
  finalizarObjetivo,
  registrarProgressoObjetivo,
  listarProgressoObjetivo,
  listarTopLeitores,
  leituraDiariaUsuario,
  indicadoresLeituraUsuario,
};
