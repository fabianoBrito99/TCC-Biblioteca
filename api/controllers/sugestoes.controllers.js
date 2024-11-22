const connection = require("../config/mysql.config");
const fs = require("fs");

// Sugestão para categorias
function listarCategorias(request, response) {
  connection.query(
    "SELECT DISTINCT categoria_principal, cor_cima, cor_baixo FROM Categoria;",
    (err, resultado) => {
      if (err) {
        console.error("Erro ao buscar sugestões de categorias:", err);
        return response.status(500).json({ erro: "Erro ao buscar categorias" });
      }
      // Retorna apenas os nomes das categorias principais como uma lista
      const categorias = resultado.map((row) => ({
        categoria_principal: row.categoria_principal,
        cor_cima: row.cor_cima,
        cor_baixo: row.cor_baixo,
      }));
      response.json(categorias);
    }
  );
}

// Sugestão para autores
function listarAutores(request, response) {
  connection.query("SELECT DISTINCT nome FROM Autor;", (err, resultado) => {
    if (err) {
      console.error("Erro ao buscar sugestões de autores:", err);
      return response.status(500).json({ erro: "Erro ao buscar autores" });
    }
    // Retorna apenas os nomes dos autores como uma lista
    const autores = resultado.map((row) => row.nome);
    response.json(autores);
  });
}

// Sugestão para editoras
function listarEditoras(request, response) {
  connection.query(
    `SELECT DISTINCT  e.nome_editora, end.cep, end.rua, end.bairro, end.numero, end.cidade, end.estado
     FROM Editora e
     LEFT JOIN Endereco end ON e.fk_id_endereco = end.id_endereco;`,
    (err, resultado) => {
      if (err) {
        console.error("Erro ao buscar editoras:", err);
        return response.status(500).json({ erro: "Erro ao buscar editoras" });
      }
      response.json(resultado);
    }
  );
}

module.exports = { listarCategorias, listarAutores, listarEditoras };
