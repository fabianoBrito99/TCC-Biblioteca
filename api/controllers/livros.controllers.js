const fs = require('fs');
const path = require('path');
const connection = require("../config/mysql.config");

function show(request, response) {
  const codigo = request.params.codigo;
  if (codigo === undefined) {
    return response.json({ erro: "Ocorreu um erro ao buscar o livro" });
  }
  connection.query(
    "SELECT * FROM livros WHERE id = ?;",
    [codigo],
    function (err, resultado) {
      if (err) {
        return response.json({ erro: "Erro ao buscar o livro" });
      }
      if (resultado.length === 0) {
        return response.json({ erro: `O código #${codigo} não foi encontrado` });
      }
      const livro = resultado[0];
      if (livro.foto_capa) {
        // Convertendo BLOB para Base64
        livro.foto_capa = `data:image/jpeg;base64,${Buffer.from(livro.foto_capa).toString('base64')}`;
      }
      return response.json(livro);
    }
  );
}

function list(request, response) {
  connection.query("SELECT * FROM livros", function (err, resultado) {
    if (err) {
      return response.json({ erro: "Ocorreram erros ao buscar dados" });
    }
    resultado.forEach(livro => {
      if (livro.foto_capa) {
        // Convertendo BLOB para Base64
        livro.foto_capa = `data:image/jpeg;base64,${Buffer.from(livro.foto_capa).toString('base64')}`;
      }
    });
    return response.json({ dados: resultado });
  });
}

function create(request, response) {
  const { nome_livro, autor, categoria, descricao, quantidade } = request.body;
  const foto_capa = request.file ? request.file.buffer : null; // Lê o arquivo como binário

  if (!nome_livro || !autor || !categoria || !descricao || !quantidade) {
    return response.status(400).json({ erro: "Todos os campos são obrigatórios" });
  }

  connection.query(
    "INSERT INTO livros (nome_livro, autor, foto_capa, categoria, descricao, quantidade) VALUES (?, ?, ?, ?, ?, ?)",
    [nome_livro, autor, foto_capa, categoria, descricao, quantidade],
    function (err, resultado) {
      if (err) {
        console.error('Erro ao cadastrar o livro:', err);
        return response.status(500).json({ erro: "Erro ao cadastrar o livro" });
      }

      return response.status(201).json({ message: "Livro cadastrado com sucesso", livro: { nome_livro, autor, categoria, descricao, quantidade } });
    }
  );
}

function listCategories(request, response) {
  connection.query("SELECT DISTINCT categoria FROM livros", function (err, resultado) {
    if (err) {
      return response.json({ erro: "Ocorreram erros ao buscar categorias" });
    }
    return response.json({ categorias: resultado.map(row => row.categoria) });
  });
}


function pesquisarLivros(request, response) {
  const query = request.query.q;
  console.log("Consulta recebida:", query); // Log para verificar a consulta

  if (!query) {
    return response.status(400).json({ erro: "Query de pesquisa não fornecida" });
  }

  connection.query(
    "SELECT id, nome_livro FROM livros WHERE nome_livro LIKE ? LIMIT 10",
    [`%${query}%`],
    function (err, resultado) {
      if (err) {
        console.error("Erro ao buscar os livros:", err); // Log para erros
        return response.status(500).json({ erro: "Erro ao buscar os livros" });
      }
      console.log("Resultado da pesquisa:", resultado); // Log para verificar o resultado
      return response.json(resultado);
    }
  );
}


module.exports = { show, list, create, listCategories, pesquisarLivros };
