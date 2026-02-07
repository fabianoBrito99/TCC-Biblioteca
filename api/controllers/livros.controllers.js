const connection = require("../config/mysql.config");
const fs = require("fs");

const path = require("path");
const fsp = require("fs/promises");
const { v4: uuidv4 } = require("uuid");
const mime = require("mime-types");

const IMAGES_BASE_URL =
  process.env.IMAGES_BASE_URL || "https://img.helenaramazzotte.online";

async function salvarImagemNoDisco(file, tipo = "capas") {
  if (!file || !file.buffer) throw new Error("Arquivo inválido");
  if (!file.mimetype || !file.mimetype.startsWith("image/"))
    throw new Error("Apenas imagens");

  const dir = path.join("/srv/images/public", tipo);
  await fsp.mkdir(dir, { recursive: true });

  const extByMime = mime.extension(file.mimetype) || "jpg";
  const nome = `${Date.now()}-${uuidv4()}.${extByMime}`;
  const destino = path.join(dir, nome);

  await fsp.writeFile(destino, file.buffer, { mode: 0o664 });

  return `${IMAGES_BASE_URL}/${tipo}/${nome}`;
}


function show(request, response) {
  const codigo = request.params.codigo;
  if (!codigo) {
    return response.status(400).json({ erro: "Código do livro não fornecido" });
  }

  connection.query(
    `SELECT L.*, 
            E.quantidade_estoque, 
            Ed.nome_editora,
            GROUP_CONCAT(DISTINCT C.categoria_principal ORDER BY C.categoria_principal SEPARATOR '||') AS categorias,
            GROUP_CONCAT(DISTINCT S.nome_subcategoria   ORDER BY S.nome_subcategoria   SEPARATOR '||') AS subcategorias,
            GROUP_CONCAT(DISTINCT A.nome                ORDER BY A.nome                SEPARATOR '||') AS autores,
            COALESCE(R.media_avaliacoes, 0) AS media_avaliacoes
     FROM Livro L
     LEFT JOIN Estoque         E  ON L.fk_id_estoque   = E.id_estoque
     LEFT JOIN Editora         Ed ON L.fk_id_editora   = Ed.id_editora
     LEFT JOIN Livro_Categoria LC ON L.id_livro        = LC.fk_id_livros
     LEFT JOIN Categoria       C  ON LC.fk_id_categoria= C.id_categoria
     LEFT JOIN Subcategoria    S  ON S.fk_id_categoria = C.id_categoria
     LEFT JOIN Autor_Livros    AL ON L.id_livro        = AL.fk_id_livros
     LEFT JOIN Autor           A  ON AL.fk_id_autor    = A.id_autor
     LEFT JOIN (
       SELECT ALv.fk_id_livro AS livro_id, AVG(Av.nota) AS media_avaliacoes
       FROM Avaliacoes_livro ALv
       JOIN Avaliacoes Av ON ALv.fk_id_avaliacoes = Av.id_avaliacoes
       GROUP BY ALv.fk_id_livro
     ) R ON R.livro_id = L.id_livro
     WHERE L.id_livro = ?
     GROUP BY L.id_livro;`,
    [codigo],
    (err, resultado) => {
      if (err) {
        return response.status(500).json({ erro: "Erro ao buscar o livro" });
      }
      if (resultado.length === 0) {
        return response.status(404).json({ erro: `Livro com código #${codigo} não encontrado` });
      }

      const row = resultado[0];
      const categoriasArr    = row.categorias    ? row.categorias.split("||").filter(Boolean)    : [];
      const subcategoriasArr = row.subcategorias ? row.subcategorias.split("||").filter(Boolean) : [];
      const autoresArr       = row.autores       ? row.autores.split("||").filter(Boolean)       : [];
      const capaUrl          = row.foto_capa_url || null;

      const livro = {
        ...row,
        categoria_principal: categoriasArr[0] || null,
        autor: autoresArr[0] || null,
        foto_capa: capaUrl,
        capa: capaUrl,
        categorias: categoriasArr,
        subcategorias: subcategoriasArr,
        autores: autoresArr,
      };

      return response.json(livro);
    }
  );
}


function list(request, response) {
  const sql = `
SELECT
  L.id_livro,
  L.nome_livro,
  L.descricao,
  L.ano_publicacao,
  L.quantidade_paginas,
  L.foto_capa_url,
  E.quantidade_estoque,
  Ed.nome_editora,

  -- agrega sem duplicar
  GROUP_CONCAT(DISTINCT C.categoria_principal ORDER BY C.categoria_principal SEPARATOR '||') AS categorias,
  GROUP_CONCAT(DISTINCT S.nome_subcategoria   ORDER BY S.nome_subcategoria   SEPARATOR '||') AS subcategorias,
  GROUP_CONCAT(DISTINCT A.nome                ORDER BY A.nome                SEPARATOR '||') AS autores,

  -- média por livro
  COALESCE(R.media_avaliacoes, 0) AS media_avaliacoes

FROM Livro L
LEFT JOIN Estoque         E  ON L.fk_id_estoque   = E.id_estoque
LEFT JOIN Editora         Ed ON L.fk_id_editora   = Ed.id_editora
LEFT JOIN Livro_Categoria LC ON L.id_livro        = LC.fk_id_livros
LEFT JOIN Categoria       C  ON LC.fk_id_categoria= C.id_categoria
LEFT JOIN Subcategoria    S  ON S.fk_id_categoria = C.id_categoria
LEFT JOIN Autor_Livros    AL ON L.id_livro        = AL.fk_id_livros
LEFT JOIN Autor           A  ON AL.fk_id_autor    = A.id_autor

LEFT JOIN (
  SELECT ALv.fk_id_livro AS livro_id, AVG(Av.nota) AS media_avaliacoes
  FROM Avaliacoes_livro ALv
  JOIN Avaliacoes Av ON ALv.fk_id_avaliacoes = Av.id_avaliacoes
  GROUP BY ALv.fk_id_livro
) R ON R.livro_id = L.id_livro

GROUP BY
  L.id_livro, L.nome_livro, L.descricao, L.ano_publicacao, L.quantidade_paginas, L.foto_capa_url,
  E.quantidade_estoque, Ed.nome_editora
ORDER BY L.id_livro DESC;
`;

  connection.query(sql, (err, resultado) => {
    if (err) {
      console.error("Erro ao buscar livros:", err);
      return response.status(500).json({ erro: "Erro ao buscar livros", detalhes: err.message });
    }

    const livros = resultado.map((row) => {
      const categoriasArr   = row.categorias   ? row.categorias.split("||").filter(Boolean)   : [];
      const subcategoriasArr= row.subcategorias? row.subcategorias.split("||").filter(Boolean): [];
      const autoresArr      = row.autores      ? row.autores.split("||").filter(Boolean)      : [];

      const capaUrl = row.foto_capa_url || null;

      return {
        ...row,
        // compatibilidade com o front atual:
        categoria_principal: categoriasArr[0] || null,
        autor: autoresArr[0] || null,
        foto_capa: capaUrl,   // se algum componente ainda usar 'foto_capa'
        capa: capaUrl,        // campo novo recomendado

        // também enviamos os arrays completos
        categorias: categoriasArr,
        subcategorias: subcategoriasArr,
        autores: autoresArr,
      };
    });

    return response.json({ livros });
  });
}

async function create(request, response) {
  try {
    const {
      nomeLivro,
      descricao,
      anoPublicacao,
      quantidade_paginas,
      editora,                 // apenas nome
      categoria_principal,
      subcategorias,
      quantidade_estoque,
      cor_cima,
      cor_baixo,
      autores,
    } = request.body;

    // Normaliza arrays vindos do FormData
    const autoresArray = Array.isArray(autores)
      ? autores
      : Object.keys(request.body)
          .filter((k) => k.startsWith("autores["))
          .sort((a, b) => parseInt(a.match(/\d+/)) - parseInt(b.match(/\d+/)))
          .map((k) => request.body[k])
          .filter(Boolean);

    const subcatsArray = Array.isArray(subcategorias)
      ? subcategorias
      : Object.keys(request.body)
          .filter((k) => k.startsWith("subcategorias["))
          .sort((a, b) => parseInt(a.match(/\d+/)) - parseInt(b.match(/\d+/)))
          .map((k) => request.body[k])
          .filter(Boolean);

    // Imagem da capa -> URL pública
    let foto_capa_url = null;
    if (request.file) {
      try {
        foto_capa_url = await salvarImagemNoDisco(request.file, "capas");
      } catch (e) {
        console.error("Falha ao salvar imagem:", e);
        return response.status(400).json({ erro: "Imagem inválida ou falha no upload" });
      }
    }

    const anoPublicacaoFormatado = new Date(anoPublicacao || Date.now());

    // 1) Cria Estoque
    connection.query(
      `INSERT INTO Estoque (quantidade_estoque) VALUES (?)`,
      [quantidade_estoque],
      (err, estoqueResult) => {
        if (err) return response.status(500).json({ erro: "Erro ao criar estoque" });
        const fk_id_estoque = estoqueResult.insertId;

        // 2) Garante Editora (apenas por nome, sem endereço)
        const nomeEditora = (editora || "").trim();
        const ensureEditora = (cb) => {
          if (!nomeEditora) return cb(null, null); // opcional: livro sem editora

          connection.query(
            `SELECT id_editora FROM Editora WHERE nome_editora = ? LIMIT 1`,
            [nomeEditora],
            (errSel, rows) => {
              if (errSel) return cb(errSel);
              if (rows && rows.length) return cb(null, rows[0].id_editora);
              connection.query(
                `INSERT INTO Editora (nome_editora) VALUES (?)`,
                [nomeEditora],
                (errIns, insRes) => {
                  if (errIns) return cb(errIns);
                  cb(null, insRes.insertId);
                }
              );
            }
          );
        };

        ensureEditora((errEd, fk_id_editora) => {
          if (errEd) return response.status(500).json({ erro: "Erro ao cadastrar/buscar editora" });

          // 3) Cria Livro
          connection.query(
            `INSERT INTO Livro (nome_livro, descricao, ano_publicacao, quantidade_paginas, fk_id_editora, fk_id_estoque, foto_capa_url)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              nomeLivro,
              descricao,
              anoPublicacaoFormatado,
              quantidade_paginas,
              fk_id_editora,         // pode ser null
              fk_id_estoque,
              foto_capa_url,
            ],
            (errLivro, livroResult) => {
              if (errLivro) return response.status(500).json({ erro: "Erro ao criar livro" });
              const livroId = livroResult.insertId;

              // 4) Autores (upsert por nome)
              if (Array.isArray(autoresArray) && autoresArray.length > 0) {
                autoresArray.forEach((autorNome) => {
                  const nome = (autorNome || "").trim();
                  if (!nome) return;

                  connection.query(
                    `SELECT id_autor FROM Autor WHERE nome = ? LIMIT 1`,
                    [nome],
                    (errA, rowsA) => {
                      if (errA) return console.error("Erro ao buscar autor:", errA);

                      const link = (autorId) =>
                        associarAutorAoLivro(livroId, autorId);

                      if (rowsA && rowsA.length) {
                        link(rowsA[0].id_autor);
                      } else {
                        connection.query(
                          `INSERT INTO Autor (nome) VALUES (?)`,
                          [nome],
                          (errNewA, resNewA) => {
                            if (errNewA) return console.error("Erro ao criar autor:", errNewA);
                            link(resNewA.insertId);
                          }
                        );
                      }
                    }
                  );
                });
              }

              // 5) Categoria principal + subcategorias
              connection.query(
                `SELECT id_categoria FROM Categoria WHERE categoria_principal = ? LIMIT 1`,
                [categoria_principal],
                (errCat, catRows) => {
                  if (errCat) return response.status(500).json({ erro: "Erro ao buscar categoria" });

                  const afterGotCategoria = (fk_id_categoria) => {
                    // Subcategorias (apenas texto ligado à categoria)
                    inserirSubcategorias(subcatsArray, fk_id_categoria);

                    // Vincula livro à categoria principal
                    associarCategoriaAoLivro(livroId, fk_id_categoria, response);
                  };

                  if (!catRows || catRows.length === 0) {
                    connection.query(
                      `INSERT INTO Categoria (categoria_principal, cor_cima, cor_baixo) VALUES (?, ?, ?)`,
                      [categoria_principal, cor_cima, cor_baixo],
                      (errNewCat, newCatRes) => {
                        if (errNewCat) return response.status(500).json({ erro: "Erro ao criar categoria" });
                        afterGotCategoria(newCatRes.insertId);
                      }
                    );
                  } else {
                    afterGotCategoria(catRows[0].id_categoria);
                  }
                }
              );
            }
          );
        });
      }
    );
  } catch (e) {
    console.error(e);
    return response.status(500).json({ erro: "Falha inesperada ao criar livro" });
  }
}


function inserirSubcategorias(subcategorias, fk_id_categoria) {
  if (Array.isArray(subcategorias) && subcategorias.length > 0) {
    subcategorias.forEach((subcategoria) => {
      connection.query(
        `INSERT INTO Subcategoria (nome_subcategoria, fk_id_categoria) VALUES (?, ?)`,
        [subcategoria, fk_id_categoria],
        (err) => {
          if (err) console.error("Erro ao adicionar subcategoria:", err);
          else console.log("Subcategoria adicionada:", subcategoria);
        }
      );
    });
  }
}


function inserirSubcategorias(subcategorias, fk_id_categoria) {
  if (Array.isArray(subcategorias) && subcategorias.length > 0) {
    subcategorias.forEach((subcategoria) => {
      connection.query(
        `INSERT INTO Subcategoria (nome_subcategoria, fk_id_categoria) VALUES (?, ?)`,
        [subcategoria, fk_id_categoria],
        (err) => {
          if (err) console.error("Erro ao adicionar subcategoria:", err);
          else console.log("Subcategoria adicionada:", subcategoria);
        }
      );
    });
  }
}

function associarAutorAoLivro(livroId, autorId) {
  connection.query(
    `INSERT INTO Autor_Livros (fk_id_autor, fk_id_livros) VALUES (?, ?)`,
    [autorId, livroId],
    (err) => {
      if (err) {
        console.error("Erro ao associar autor ao livro:", err);
      } else {
        console.log("Autor associado ao livro com sucesso.");
      }
    }
  );
}

function associarCategoriaAoLivro(livroId, fk_id_categoria, response) {
  connection.query(
    `INSERT INTO Livro_Categoria (fk_id_livros, fk_id_categoria) VALUES (?, ?)`,
    [livroId, fk_id_categoria],
    (err) => {
      if (err) {
        console.error("Erro ao associar categoria ao livro:", err);
        return response
          .status(500)
          .json({ erro: "Erro ao associar categoria" });
      }
      console.log("Categoria associada ao livro com sucesso.");
      response.status(200).json({ mensagem: "Livro criado com sucesso!" });
    }
  );
}

// Lista todas as categorias
function listaCategorias(request, response) {
  connection.query(
    "SELECT DISTINCT categoria_principal FROM Categoria;",
    (err, resultado) => {
      if (err)
        return response.status(500).json({ erro: "Erro ao buscar categorias" });
      return response.json({
        categorias: resultado.map((row) => row.categoria_principal),
      });
    }
  );
}

// Adiciona uma nova categoria ao livro
function addCategoria(request, response) {
  const { livroId, categoriaId } = request.body;

  connection.query(
    `INSERT INTO Livro_Categoria (fk_id_livros, fk_id_categoria) VALUES (?, ?);`,
    [livroId, categoriaId],
    (err, resultado) => {
      if (err)
        return response
          .status(500)
          .json({ erro: "Erro ao associar categoria ao livro" });
      return response.json({
        message: "Categoria associada ao livro com sucesso",
      });
    }
  );
}

// Lista todos os autores de um livro
function ListaAutorLivro(request, response) {
  const { livroId } = request.params;

  connection.query(
    `SELECT DISTINCT Autor.nome
     FROM Autor
     JOIN Autor_Livros ON Autor.id_autor = Autor_Livros.fk_id_autor
     WHERE Autor_Livros.fk_id_livros = ?;`,
    [livroId],
    (err, resultado) => {
      if (err)
        return response
          .status(500)
          .json({ erro: "Erro ao buscar autores do livro" });
      return response.json({ autores: resultado.map((row) => row.nome) });
    }
  );
}

function createEditora(request, response) {
  const {
    nome_livro,
    descricao,
    ano_publicacao,
    quantidade_paginas,
    fk_id_estoque,
    fk_id_editora,
  } = request.body;
  const foto_capa = request.file ? request.file.buffer : null;

  if (
    !nome_livro ||
    !descricao ||
    !ano_publicacao ||
    !quantidade_paginas ||
    !fk_id_estoque ||
    !fk_id_editora
  ) {
    return response
      .status(400)
      .json({ erro: "Todos os campos são obrigatórios" });
  }

  connection.query(
    `INSERT INTO Livro (nome_livro, foto_capa, descricao, ano_publicacao, quantidade_paginas, fk_id_estoque, fk_id_editora)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      nome_livro,
      foto_capa,
      descricao,
      ano_publicacao,
      quantidade_paginas,
      fk_id_estoque,
      fk_id_editora,
    ],
    (err, resultado) => {
      if (err)
        return response.status(500).json({ erro: "Erro ao cadastrar o livro" });
      return response.status(201).json({
        message: "Livro cadastrado com sucesso",
        livroId: resultado.insertId,
      });
    }
  );
}
function listEditora(request, response) {
  connection.query(
    `SELECT DISTINCT nome_editora
     FROM Editora;`,
    (err, resultado) => {
      if (err)
        return response.status(500).json({ erro: "Erro ao buscar livros" });
      return response.json({ dados: resultado });
    }
  );
}
function showEditora(request, response) {
  const codigo = request.params.codigo;
  if (!codigo) {
    return response.status(400).json({ erro: "Código do livro não fornecido" });
  }

  connection.query(
    `SELECT Livro.*, Estoque.quantidade_estoque, Editora.nome_editora
     FROM Livro
     LEFT JOIN Estoque ON Livro.fk_id_estoque = Estoque.id_estoque
     LEFT JOIN Editora ON Livro.fk_id_editora = Editora.id_editora
     WHERE Livro.id_livro = ?;`,
    [codigo],
    (err, resultado) => {
      if (err)
        return response.status(500).json({ erro: "Erro ao buscar o livro" });
      if (resultado.length === 0) {
        return response
          .status(404)
          .json({ erro: `Livro com código #${codigo} não encontrado` });
      }
      return response.json(resultado[0]);
    }
  );
}

// function sugestoesLivro(request, response) {
//   const categoria = request.query.categoria;

//   let query = `
//     SELECT Livro.id_livro, Livro.nome_livro, Livro.foto_capa, Autor.nome AS nome_autor
//     FROM Livro
//     LEFT JOIN Livro_Categoria ON Livro.id_livro = Livro_Categoria.fk_id_livros
//     LEFT JOIN Categoria ON Livro_Categoria.fk_id_categoria = Categoria.id_categoria
//     LEFT JOIN Autor_Livros ON Livro.id_livro = Autor_Livros.fk_id_livros
//     LEFT JOIN Autor ON Autor_Livros.fk_id_autor = Autor.id_autor
//   `;

//   let params = [];

//   if (categoria) {
//     query += ` WHERE Categoria.categoria_principal = ?`;
//     params.push(categoria);
//   }

//   connection.query(query, params, (err, resultado) => {
//     if (err) {
//       return response.status(500).json({ erro: "Erro ao buscar livros" });
//     }

//     return response.json({ livros: resultado });
//   });
// }

function sugestoesLivro(request, response) {
  const categoria = request.query.categoria;

  // Monta a consulta agregando autores e usando a URL da capa
  let query = `
    SELECT
      L.id_livro,
      L.nome_livro,
      L.foto_capa_url,
      GROUP_CONCAT(DISTINCT A.nome ORDER BY A.nome SEPARATOR '||') AS autores
    FROM Livro L
    LEFT JOIN Livro_Categoria LC ON L.id_livro = LC.fk_id_livros
    LEFT JOIN Categoria C        ON LC.fk_id_categoria = C.id_categoria
    LEFT JOIN Autor_Livros AL    ON L.id_livro = AL.fk_id_livros
    LEFT JOIN Autor A            ON AL.fk_id_autor = A.id_autor
  `;

  const params = [];

  if (categoria) {
    query += ` WHERE C.categoria_principal = ?`;
    params.push(categoria);
  }

  // Evita duplicidade por conta dos JOINs
  query += `
    GROUP BY L.id_livro, L.nome_livro, L.foto_capa_url
    ORDER BY L.id_livro DESC
    LIMIT 12
  `;

  connection.query(query, params, (err, resultado) => {
    if (err) {
      console.error("Erro ao buscar livros:", err);
      return response.status(500).json({ erro: "Erro ao buscar livros" });
    }

    const livros = resultado.map((row) => {
      const autoresArr = row.autores ? row.autores.split("||").filter(Boolean) : [];
      const capaUrl    = row.foto_capa_url || null;

      return {
        id_livro: row.id_livro,
        nome_livro: row.nome_livro,

        // novo campo principal
        foto_capa_url: capaUrl,

        // aliases p/ compatibilidade com o front atual
        foto_capa: capaUrl,
        capa: capaUrl,

        // autor “principal” + lista completa
        autor: autoresArr[0] || null,
        autores: autoresArr,
      };
    });

    return response.json({ livros });
  });
}






// Coloque perto do topo, junto dos requires
function removerImagemDoDiscoPorURL(url) {
  try {
    if (!url) return;
    let pathname;
    try {
      const u = new URL(url);
      pathname = u.pathname; // ex: /capas/arquivo.jpg
    } catch {
      pathname = url.startsWith("/") ? url : `/${url}`;
    }
    const filePath = path.join("/srv/images/public", pathname); // /srv/images/public/capas/arquivo.jpg
    fs.unlink(filePath, (err) => {
      if (err && err.code !== "ENOENT") {
        console.warn("Não foi possível remover a imagem:", filePath, err.message);
      }
    });
  } catch (e) {
    console.warn("Falha ao processar remoção de imagem:", e.message);
  }
}

function destroy(request, response) {
  const { id } = request.params;
  if (!id) return response.status(400).json({ erro: "ID do livro não fornecido" });

  // 1) Buscar dados do livro (fk_estoque e foto_capa_url)
  connection.query(
    `SELECT id_livro, fk_id_estoque, foto_capa_url
     FROM Livro
     WHERE id_livro = ?`,
    [id],
    (errSel, rows) => {
      if (errSel) {
        console.error("Erro ao buscar livro:", errSel);
        return response.status(500).json({ erro: "Erro ao buscar livro" });
      }
      if (!rows || rows.length === 0) {
        return response.status(404).json({ erro: `Livro #${id} não encontrado` });
      }

      const { fk_id_estoque, foto_capa_url } = rows[0];

      // helpers de delete
      const del = (sql, params) =>
        new Promise((resolve, reject) => {
          connection.query(sql, params, (e) => (e ? reject(e) : resolve()));
        });

      (async () => {
        try {
          // 2) Apagar vínculos dependentes (ordem não crítica sem FK restritivas)
          await del(`DELETE FROM Autor_Livros WHERE fk_id_livros = ?`, [id]);
          await del(`DELETE FROM Livro_Categoria WHERE fk_id_livros = ?`, [id]);
          await del(`DELETE FROM Avaliacoes_livro WHERE fk_id_livro = ?`, [id]);

          // 3) Apagar o livro
          await del(`DELETE FROM Livro WHERE id_livro = ?`, [id]);

          // 4) Apagar estoque se ficar órfão
          if (fk_id_estoque) {
            const checkSql = `SELECT COUNT(*) AS cnt FROM Livro WHERE fk_id_estoque = ?`;
            connection.query(checkSql, [fk_id_estoque], (errCnt, cntRows) => {
              if (!errCnt) {
                const cnt = (cntRows && cntRows[0] && cntRows[0].cnt) || 0;
                if (cnt === 0) {
                  connection.query(
                    `DELETE FROM Estoque WHERE id_estoque = ?`,
                    [fk_id_estoque],
                    (errDelEst) => {
                      if (errDelEst) {
                        console.warn("Falha ao remover estoque órfão:", errDelEst.message);
                      }
                    }
                  );
                }
              }
            });
          }

          // 5) Remover imagem do disco (best-effort, fora da query chain)
          removerImagemDoDiscoPorURL(foto_capa_url);

          return response.json({ mensagem: "Livro excluído com sucesso" });
        } catch (e) {
          console.error("Erro ao excluir livro:", e);
          return response.status(500).json({ erro: "Erro interno ao excluir o livro" });
        }
      })();
    }
  );
}








async function update(request, response) {
  try {
    const { id } = request.params;
    if (!id) return response.status(400).json({ erro: "ID do livro não fornecido" });

    const {
      nomeLivro,
      descricao,
      anoPublicacao,
      quantidade_paginas,
      editora,                 // apenas nome
      categoria_principal,
      subcategorias,
      quantidade_estoque,
      cor_cima,
      cor_baixo,
      autores,
    } = request.body;

    // Normaliza arrays vindos do FormData
    const autoresArray = Array.isArray(autores)
      ? autores
      : Object.keys(request.body)
          .filter((k) => k.startsWith("autores["))
          .sort((a, b) => parseInt(a.match(/\d+/)) - parseInt(b.match(/\d+/)))
          .map((k) => request.body[k])
          .filter(Boolean);

    const subcatsArray = Array.isArray(subcategorias)
      ? subcategorias
      : Object.keys(request.body)
          .filter((k) => k.startsWith("subcategorias["))
          .sort((a, b) => parseInt(a.match(/\d+/)) - parseInt(b.match(/\d+/)))
          .map((k) => request.body[k])
          .filter(Boolean);

    // 0) Buscar info atual do livro (fk_estoque, capa atual)
    connection.query(
      `SELECT id_livro, fk_id_estoque, fk_id_editora, foto_capa_url
       FROM Livro
       WHERE id_livro = ?`,
      [id],
      async (errSel, rows) => {
        if (errSel) {
          console.error("Erro ao buscar livro:", errSel);
          return response.status(500).json({ erro: "Erro ao buscar livro" });
        }
        if (!rows || rows.length === 0) {
          return response.status(404).json({ erro: `Livro #${id} não encontrado` });
        }

        const { fk_id_estoque, foto_capa_url: fotoAtual } = rows[0];

        // 1) Se veio nova capa, salva e (opcional) remove a antiga
        let novaFotoUrl = fotoAtual || null;
        if (request.file) {
          try {
            novaFotoUrl = await salvarImagemNoDisco(request.file, "capas");
            // se quiser remover a antiga do disco:
            try { removerImagemDoDiscoPorURL && removerImagemDoDiscoPorURL(fotoAtual); } catch (_) {}
          } catch (e) {
            console.error("Falha ao salvar imagem:", e);
            return response.status(400).json({ erro: "Imagem inválida ou falha no upload" });
          }
        }

        // 2) Editora por nome (busca/insere)
        const ensureEditora = () =>
          new Promise((resolve, reject) => {
            const nomeEditora = (editora || "").trim();
            if (!nomeEditora) return resolve(null);
            connection.query(
              `SELECT id_editora FROM Editora WHERE nome_editora = ? LIMIT 1`,
              [nomeEditora],
              (e1, r1) => {
                if (e1) return reject(e1);
                if (r1 && r1.length) return resolve(r1[0].id_editora);
                connection.query(
                  `INSERT INTO Editora (nome_editora) VALUES (?)`,
                  [nomeEditora],
                  (e2, r2) => (e2 ? reject(e2) : resolve(r2.insertId))
                );
              }
            );
          });

        // 3) Categoria principal (busca/insere)
        const ensureCategoria = () =>
          new Promise((resolve, reject) => {
            if (!categoria_principal) return reject(new Error("Categoria principal não informada"));
            connection.query(
              `SELECT id_categoria FROM Categoria WHERE categoria_principal = ? LIMIT 1`,
              [categoria_principal],
              (e1, r1) => {
                if (e1) return reject(e1);
                if (r1 && r1.length) return resolve(r1[0].id_categoria);
                connection.query(
                  `INSERT INTO Categoria (categoria_principal, cor_cima, cor_baixo) VALUES (?, ?, ?)`,
                  [categoria_principal, cor_cima, cor_baixo],
                  (e2, r2) => (e2 ? reject(e2) : resolve(r2.insertId))
                );
              }
            );
          });

        // 4) Utilitários de query (prometizados)
        const q = (sql, params=[]) =>
          new Promise((resolve, reject) =>
            connection.query(sql, params, (e, r) => (e ? reject(e) : resolve(r)))
          );

        try {
          const fk_id_editora = await ensureEditora();
          const fk_id_categoria = await ensureCategoria();

          // 5) Atualiza os campos do Livro
          const anoPublicacaoFormatado = new Date(anoPublicacao || Date.now());
          await q(
            `UPDATE Livro
             SET nome_livro = ?, descricao = ?, ano_publicacao = ?, quantidade_paginas = ?,
                 fk_id_editora = ?, foto_capa_url = ?
             WHERE id_livro = ?`,
            [
              nomeLivro,
              descricao,
              anoPublicacaoFormatado,
              quantidade_paginas,
              fk_id_editora,
              novaFotoUrl,
              id,
            ]
          );

          // 6) Atualiza estoque (mesmo registro)
          if (fk_id_estoque) {
            await q(
              `UPDATE Estoque SET quantidade_estoque = ? WHERE id_estoque = ?`,
              [quantidade_estoque, fk_id_estoque]
            );
          }

          // 7) Vincula categoria principal (substitui vínculos antigos)
          await q(`DELETE FROM Livro_Categoria WHERE fk_id_livros = ?`, [id]);
          await q(
            `INSERT INTO Livro_Categoria (fk_id_livros, fk_id_categoria) VALUES (?, ?)`,
            [id, fk_id_categoria]
          );

          // 8) Garante subcategorias existirem (ligadas à categoria) — sem apagar as antigas globais
          for (const sub of subcatsArray) {
            const nome = (sub || "").trim();
            if (!nome) continue;
            const existe = await q(
              `SELECT id_subcategoria FROM Subcategoria WHERE nome_subcategoria = ? AND fk_id_categoria = ? LIMIT 1`,
              [nome, fk_id_categoria]
            );
            if (!Array.isArray(existe) || existe.length === 0) {
              await q(
                `INSERT INTO Subcategoria (nome_subcategoria, fk_id_categoria) VALUES (?, ?)`,
                [nome, fk_id_categoria]
              );
            }
          }

          // 9) Atualiza autores (recria vínculos)
          await q(`DELETE FROM Autor_Livros WHERE fk_id_livros = ?`, [id]);
          for (const autorNome of autoresArray) {
            const nome = (autorNome || "").trim();
            if (!nome) continue;
            const a = await q(`SELECT id_autor FROM Autor WHERE nome = ? LIMIT 1`, [nome]);
            let autorId = null;
            if (Array.isArray(a) && a.length) {
              autorId = a[0].id_autor;
            } else {
              const ins = await q(`INSERT INTO Autor (nome) VALUES (?)`, [nome]);
              autorId = ins.insertId;
            }
            await q(`INSERT INTO Autor_Livros (fk_id_autor, fk_id_livros) VALUES (?, ?)`, [
              autorId,
              id,
            ]);
          }

          return response.json({ mensagem: "Livro atualizado com sucesso!" });
        } catch (e) {
          console.error("Erro ao atualizar livro:", e);
          return response.status(500).json({ erro: "Erro ao atualizar livro" });
        }
      }
    );
  } catch (e) {
    console.error(e);
    return response.status(500).json({ erro: "Falha inesperada ao atualizar livro" });
  }
}






module.exports = {
  show,
  list,
  create,
  update,
  destroy,
  listaCategorias,
  addCategoria,
  ListaAutorLivro,
  createEditora,
  listEditora,
  showEditora,
  sugestoesLivro,
};
