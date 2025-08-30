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
      editora,
      categoria_principal,
      subcategorias,
      quantidade_estoque,
      cep,
      rua,
      bairro,
      numero,
      cidade,
      estado,
      cor_cima,
      cor_baixo,
      autores,
    } = request.body;

    // Normaliza arrays vindos do FormData (autores[0], autores[1]... / subcategorias[0]...)
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

    // Salva imagem (se enviada) e gera URL
    let foto_capa_url = null;
    if (request.file) {
      try {
        foto_capa_url = await salvarImagemNoDisco(request.file, "capas");
      } catch (e) {
        console.error("Falha ao salvar imagem:", e);
        return response
          .status(400)
          .json({ erro: "Imagem inválida ou falha no upload" });
      }
    }

    const anoPublicacaoFormatado = new Date(anoPublicacao || Date.now());
    console.log("Iniciando processo de criação do livro...");

    // Estoque
    connection.query(
      `INSERT INTO Estoque (quantidade_estoque) VALUES (?)`,
      [quantidade_estoque],
      (err, estoqueResult) => {
        if (err)
          return response.status(500).json({ erro: "Erro ao criar estoque" });
        const fk_id_estoque = estoqueResult.insertId;

        // Endereço
        connection.query(
          `INSERT INTO Endereco (cep, rua, numero, bairro, cidade, estado) VALUES (?, ?, ?, ?, ?, ?)`,
          [cep, rua, numero, bairro, cidade, estado],
          (err, enderecoResult) => {
            if (err)
              return response
                .status(500)
                .json({ erro: "Erro ao cadastrar endereço" });
            const fk_id_endereco = enderecoResult.insertId;

            // Editora
            connection.query(
              `INSERT INTO Editora (nome_editora, fk_id_endereco) VALUES (?, ?)`,
              [editora, fk_id_endereco],
              (err, editoraResult) => {
                if (err)
                  return response
                    .status(500)
                    .json({ erro: "Erro ao cadastrar editora" });
                const fk_id_editora = editoraResult.insertId;

                // Livro (agora usando foto_capa_url em vez de BLOB)
                connection.query(
                  `INSERT INTO Livro (nome_livro, descricao, ano_publicacao, quantidade_paginas, fk_id_editora, fk_id_estoque, foto_capa_url) 
                   VALUES (?, ?, ?, ?, ?, ?, ?)`,
                  [
                    nomeLivro,
                    descricao,
                    anoPublicacaoFormatado,
                    quantidade_paginas,
                    fk_id_editora,
                    fk_id_estoque,
                    foto_capa_url,
                  ],
                  (err, livroResult) => {
                    if (err)
                      return response
                        .status(500)
                        .json({ erro: "Erro ao criar livro" });
                    const livroId = livroResult.insertId;

                    // Autores
                    if (
                      Array.isArray(autoresArray) &&
                      autoresArray.length > 0
                    ) {
                      autoresArray.forEach((autorNome) => {
                        connection.query(
                          `SELECT id_autor FROM Autor WHERE nome = ?`,
                          [autorNome],
                          (err, autorResult) => {
                            if (err)
                              return response
                                .status(500)
                                .json({ erro: "Erro ao buscar autor" });
                            let autorId;
                            if (autorResult.length === 0) {
                              connection.query(
                                `INSERT INTO Autor (nome) VALUES (?)`,
                                [autorNome],
                                (err, novoAutorResult) => {
                                  if (err)
                                    return response
                                      .status(500)
                                      .json({ erro: "Erro ao criar autor" });
                                  autorId = novoAutorResult.insertId;
                                  associarAutorAoLivro(livroId, autorId);
                                }
                              );
                            } else {
                              autorId = autorResult[0].id_autor;
                              associarAutorAoLivro(livroId, autorId);
                            }
                          }
                        );
                      });
                    }

                    // Categorias
                    connection.query(
                      `SELECT id_categoria FROM Categoria WHERE categoria_principal = ?`,
                      [categoria_principal],
                      (err, categoriaResult) => {
                        if (err)
                          return response
                            .status(500)
                            .json({
                              erro: "Erro ao encontrar categoria principal",
                            });
                        let fk_id_categoria;

                        const inserirSubs = () =>
                          inserirSubcategorias(subcatsArray, fk_id_categoria);

                        if (categoriaResult.length === 0) {
                          connection.query(
                            `INSERT INTO Categoria (categoria_principal, cor_cima, cor_baixo) VALUES (?, ?, ?)`,
                            [categoria_principal, cor_cima, cor_baixo],
                            (err, categoriaCriadaResult) => {
                              if (err)
                                return response
                                  .status(500)
                                  .json({ erro: "Erro ao criar categoria" });
                              fk_id_categoria = categoriaCriadaResult.insertId;
                              inserirSubs();
                              associarCategoriaAoLivro(
                                livroId,
                                fk_id_categoria,
                                response
                              );
                            }
                          );
                        } else {
                          fk_id_categoria = categoriaResult[0].id_categoria;
                          inserirSubs();
                          associarCategoriaAoLivro(
                            livroId,
                            fk_id_categoria,
                            response
                          );
                        }
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  } catch (e) {
    console.error(e);
    return response
      .status(500)
      .json({ erro: "Falha inesperada ao criar livro" });
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

function sugestoesLivro(request, response) {
  const categoria = request.query.categoria;

  let query = `
    SELECT Livro.id_livro, Livro.nome_livro, Livro.foto_capa, Autor.nome AS nome_autor
    FROM Livro
    LEFT JOIN Livro_Categoria ON Livro.id_livro = Livro_Categoria.fk_id_livros
    LEFT JOIN Categoria ON Livro_Categoria.fk_id_categoria = Categoria.id_categoria
    LEFT JOIN Autor_Livros ON Livro.id_livro = Autor_Livros.fk_id_livros
    LEFT JOIN Autor ON Autor_Livros.fk_id_autor = Autor.id_autor
  `;

  let params = [];

  if (categoria) {
    query += ` WHERE Categoria.categoria_principal = ?`;
    params.push(categoria);
  }

  connection.query(query, params, (err, resultado) => {
    if (err) {
      return response.status(500).json({ erro: "Erro ao buscar livros" });
    }

    return response.json({ livros: resultado });
  });
}

module.exports = {
  show,
  list,
  create,
  listaCategorias,
  addCategoria,
  ListaAutorLivro,
  createEditora,
  listEditora,
  showEditora,
  sugestoesLivro,
};
