const connection = require("../config/mysql.config");
const fs = require("fs");

// Exibe detalhes de um livro específico
function show(request, response) {
  const codigo = request.params.codigo;
  if (!codigo) {
    return response.status(400).json({ erro: "Código do livro não fornecido" });
  }

  connection.query(
    `SELECT Livro.*, Estoque.quantidade_estoque, Editora.nome_editora,
            Categoria.categoria_principal, Subcategoria.nome_subcategoria, Categoria.cor_cima, Categoria.cor_baixo,
            Autor.nome AS nome_autor
     FROM Livro
     LEFT JOIN Estoque ON Livro.fk_id_estoque = Estoque.id_estoque
     LEFT JOIN Editora ON Livro.fk_id_editora = Editora.id_editora
     LEFT JOIN Livro_Categoria ON Livro.id_livro = Livro_Categoria.fk_id_livros
     LEFT JOIN Categoria ON Livro_Categoria.fk_id_categoria = Categoria.id_categoria
     LEFT JOIN Subcategoria ON Subcategoria.fk_id_categoria = Categoria.id_categoria
     LEFT JOIN Autor_Livros ON Livro.id_livro = Autor_Livros.fk_id_livros
     LEFT JOIN Autor ON Autor_Livros.fk_id_autor = Autor.id_autor
     WHERE Livro.id_livro = ?;`,
    [codigo],
    (err, resultado) => {
      if (err) {
        return response.status(500).json({ erro: "Erro ao buscar o livro" });
      }
      if (resultado.length === 0) {
        return response
          .status(404)
          .json({ erro: `Livro com código #${codigo} não encontrado` });
      }

      const livro = resultado[0];

      // Convertendo BLOB para Base64 se a foto_capa existir
      if (livro.foto_capa) {
        livro.foto_capa = `data:image/jpeg;base64,${Buffer.from(
          livro.foto_capa
        ).toString("base64")}`;
      }

      return response.json(livro);
    }
  );
}

// Lista todos os livros
function list(request, response) {
  connection.query(
    `SELECT DISTINCT
    Livro.*,
    Estoque.quantidade_estoque,
    Editora.nome_editora,
    Categoria.categoria_principal,
    Subcategoria.nome_subcategoria,
    Autor.nome AS autor,
    COALESCE(SUM(Avaliacoes.nota) / NULLIF(COUNT(Avaliacoes.id_avaliacoes), 0), 0) AS media_avaliacoes
FROM 
    Livro
LEFT JOIN 
    Estoque ON Livro.fk_id_estoque = Estoque.id_estoque
LEFT JOIN 
    Editora ON Livro.fk_id_editora = Editora.id_editora
LEFT JOIN 
    Livro_Categoria ON Livro.id_livro = Livro_Categoria.fk_id_livros
LEFT JOIN 
    Categoria ON Livro_Categoria.fk_id_categoria = Categoria.id_categoria
LEFT JOIN 
    Subcategoria ON Subcategoria.fk_id_categoria = Categoria.id_categoria
LEFT JOIN 
    Autor_Livros ON Livro.id_livro = Autor_Livros.fk_id_livros
LEFT JOIN 
    Autor ON Autor_Livros.fk_id_autor = Autor.id_autor
LEFT JOIN 
    Avaliacoes_livro ON Livro.id_livro = Avaliacoes_livro.fk_id_livro
LEFT JOIN 
    Avaliacoes ON Avaliacoes_livro.fk_id_avaliacoes = Avaliacoes.id_avaliacoes
GROUP BY 
    Livro.id_livro,
    Estoque.quantidade_estoque,
    Editora.nome_editora,
    Categoria.categoria_principal,
    Subcategoria.nome_subcategoria,
    Autor.nome;



`,
    (err, resultado) => {
      if (err) {
        console.error("Erro ao buscar livros:", err);
        return response
          .status(500)
          .json({ erro: "Erro ao buscar livros", detalhes: err.message });
      }

      resultado.forEach((livro) => {
        if (livro.foto_capa) {
          // Convertendo BLOB para Base64
          livro.foto_capa = `data:image/jpeg;base64,${Buffer.from(
            livro.foto_capa
          ).toString("base64")}`;
        }
      });

      return response.json({ livros: resultado });
    }
  );
}

// Função para inserir subcategorias corretamente
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

// Função de criação de livro
function create(request, response) {
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
    autores
  } = request.body;

  const foto_capa = request.file ? request.file.buffer : null;
  const anoPublicacaoFormatado = new Date(anoPublicacao);

  console.log("Iniciando processo de criação do livro...");

  connection.query(
    `INSERT INTO Estoque (quantidade_estoque) VALUES (?)`,
    [quantidade_estoque],
    (err, estoqueResult) => {
      if (err) return response.status(500).json({ erro: "Erro ao criar estoque" });
      const fk_id_estoque = estoqueResult.insertId;
      console.log("Estoque criado com ID:", fk_id_estoque);

      connection.query(
        `INSERT INTO Endereco (cep, rua, numero, bairro, cidade, estado) VALUES (?, ?, ?, ?, ?, ?)`,
        [cep, rua, numero, bairro, cidade, estado],
        (err, enderecoResult) => {
          if (err) return response.status(500).json({ erro: "Erro ao cadastrar endereço" });
          const fk_id_endereco = enderecoResult.insertId;
          console.log("Endereço criado com ID:", fk_id_endereco);

          connection.query(
            `INSERT INTO Editora (nome_editora, fk_id_endereco) VALUES (?, ?)`,
            [editora, fk_id_endereco],
            (err, editoraResult) => {
              if (err) return response.status(500).json({ erro: "Erro ao cadastrar editora" });
              const fk_id_editora = editoraResult.insertId;
              console.log("Editora criada com ID:", fk_id_editora);

              // Insere o livro com foto_capa como BLOB
              connection.query(
                `INSERT INTO Livro (nome_livro, descricao, ano_publicacao, quantidade_paginas, fk_id_editora, fk_id_estoque, foto_capa) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [nomeLivro, descricao, anoPublicacaoFormatado, quantidade_paginas, fk_id_editora, fk_id_estoque, foto_capa],
                (err, livroResult) => {
                  if (err) return response.status(500).json({ erro: "Erro ao criar livro" });
                  const livroId = livroResult.insertId;
                  console.log("Livro criado com ID:", livroId);

                  // Processa autores
                  if (Array.isArray(autores) && autores.length > 0) {
                    autores.forEach((autorNome) => {
                      connection.query(
                        `SELECT id_autor FROM Autor WHERE nome = ?`,
                        [autorNome],
                        (err, autorResult) => {
                          if (err) return response.status(500).json({ erro: "Erro ao buscar autor" });
                          let autorId;
                          if (autorResult.length === 0) {
                            connection.query(
                              `INSERT INTO Autor (nome) VALUES (?)`,
                              [autorNome],
                              (err, novoAutorResult) => {
                                if (err) return response.status(500).json({ erro: "Erro ao criar autor" });
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
                  } else {
                    console.log("Nenhum autor fornecido para associação.");
                  }

                  // Processa categorias
                  connection.query(
                    `SELECT id_categoria FROM Categoria WHERE categoria_principal = ?`,
                    [categoria_principal],
                    (err, categoriaResult) => {
                      if (err) return response.status(500).json({ erro: "Erro ao encontrar categoria principal" });

                      let fk_id_categoria;
                      if (categoriaResult.length === 0) {
                        connection.query(
                          `INSERT INTO Categoria (categoria_principal, cor_cima, cor_baixo) VALUES (?, ?, ?)`,
                          [categoria_principal, cor_cima, cor_baixo],
                          (err, categoriaCriadaResult) => {
                            if (err) return response.status(500).json({ erro: "Erro ao criar categoria" });
                            fk_id_categoria = categoriaCriadaResult.insertId;
                            inserirSubcategorias(subcategorias, fk_id_categoria);
                            associarCategoriaAoLivro(livroId, fk_id_categoria, response);
                          }
                        );
                      } else {
                        fk_id_categoria = categoriaResult[0].id_categoria;
                        inserirSubcategorias(subcategorias, fk_id_categoria);
                        associarCategoriaAoLivro(livroId, fk_id_categoria, response);
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
      return response
        .status(201)
        .json({
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
  sugestoesLivro
};
