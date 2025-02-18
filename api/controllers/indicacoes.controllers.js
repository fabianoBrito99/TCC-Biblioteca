const connection = require("../config/mysql.config");

// Lista as indicações (máximo de 5 livros)
function listarIndicacoes(req, res) {
    connection.query(`
        SELECT Indicacoes.id_indicacao, Livro.id_livro, Livro.nome_livro, Livro.foto_capa, Autor.nome AS nome_autor 
        FROM Indicacoes
        JOIN Livro ON Indicacoes.fk_id_livro = Livro.id_livro
        JOIN Autor_Livros ON Livro.id_livro = Autor_Livros.fk_id_livros
        JOIN Autor ON Autor_Livros.fk_id_autor = Autor.id_autor
        ORDER BY id_indicacao DESC
    `, (err, result) => {
        if (err) return res.status(500).json({ erro: "Erro ao buscar indicações" });
        res.json({ indicacoes: result });
    });
}

// Adiciona uma indicação (limite de 5)
function adicionarIndicacao(req, res) {
    const { fk_id_livro } = req.body;
    
    connection.query(`SELECT COUNT(*) AS total FROM Indicacoes`, (err, result) => {
        if (err) return res.status(500).json({ erro: "Erro ao contar indicações" });
        
        if (result[0].total >= 5) {
            return res.status(400).json({ erro: "Limite de 5 indicações atingido. Exclua uma para adicionar outra." });
        }
        
        connection.query(
            `INSERT INTO Indicacoes (fk_id_livro) VALUES (?)`,
            [fk_id_livro],
            (err) => {
                if (err) return res.status(500).json({ erro: "Erro ao adicionar indicação" });
                res.status(201).json({ mensagem: "Indicação adicionada com sucesso!" });
            }
        );
    });
}

// Remove uma indicação
function excluirIndicacao(req, res) {
    const { id_indicacao } = req.params;
    
    connection.query(
        `DELETE FROM Indicacoes WHERE id_indicacao = ?`,
        [id_indicacao],
        (err) => {
            if (err) return res.status(500).json({ erro: "Erro ao excluir indicação" });
            res.json({ mensagem: "Indicação excluída com sucesso!" });
        }
    );
}

// Busca livros pelo nome digitado
function buscarLivros(req, res) {
    const { nome } = req.query;

    connection.query(
        `SELECT id_livro, nome_livro FROM Livro WHERE nome_livro LIKE ? LIMIT 5`,
        [`%${nome}%`],
        (err, result) => {
            if (err) return res.status(500).json({ erro: "Erro ao buscar livros" });
            res.json({ livros: result });
        }
    );
}

module.exports = { listarIndicacoes, adicionarIndicacao, excluirIndicacao, buscarLivros };