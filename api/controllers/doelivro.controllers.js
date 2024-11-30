const connection = require("../config/mysql.config");

// Listar todas as sugestões, incluindo dados do usuário
function listarSugestoes(req, res) {
  const query = `
    SELECT 
      s.id_sugestao,
      s.nome_livro,
      s.autor, -- Inclui o autor na consulta
      s.descricao_livro,
      s.motivo_sugestao,
      s.data_sugestao,
      u.nome_login AS nome_usuario,
      TO_BASE64(u.foto_usuario) AS foto_usuario -- Converte a imagem em base64
    FROM Sugestoes s
    LEFT JOIN Usuario u ON s.fk_id_usuario = u.id_usuario
    ORDER BY s.data_sugestao DESC
  `;

  connection.query(query, (error, results) => {
    if (error) {
      console.error("Erro ao buscar sugestões:", error);
      return res.status(500).json({ erro: "Erro ao buscar sugestões" });
    }
    res.json(results);
  });
}


// Adicionar uma nova sugestão
function adicionarSugestao(req, res) {
  const { nome_livro, autor, descricao_livro, motivo_sugestao, fk_id_usuario } = req.body;

  // Verificar se os campos obrigatórios estão presentes
  if (!motivo_sugestao || !fk_id_usuario) {
    return res.status(400).json({ erro: "Motivo e ID do usuário são obrigatórios" });
  }

  // Verifica se o nome do livro ou autor foram fornecidos, caso contrário, define como null
  const nomeLivroValue = nome_livro || null;
  const autorValue = autor || null;

  const query = `
    INSERT INTO Sugestoes (nome_livro, autor, descricao_livro, motivo_sugestao, fk_id_usuario) 
    VALUES (?, ?, ?, ?, ?)
  `;

  // Realizar a inserção no banco
  connection.query(query, [nomeLivroValue, autorValue, descricao_livro, motivo_sugestao, fk_id_usuario], (error) => {
    if (error) {
      console.error("Erro ao adicionar sugestão:", error);
      return res.status(500).json({ erro: "Erro ao adicionar sugestão" });
    }
    res.json({ mensagem: "Sugestão adicionada com sucesso!" });
  });
};

module.exports = { listarSugestoes,adicionarSugestao}