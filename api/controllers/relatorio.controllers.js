const connection = require("../config/mysql.config");

const gerarRelatorios = (req, res) => {
  const { dataInicio, dataFim } = req.query;

  // Corrigir formatação da data
  const formatarData = (data) => {
    const [ano, mes, dia] = data.split("/"); // Invertendo a ordem para o formato ISO
    return `${ano}-${mes}-${dia}`;
  };

  const dataInicioFormatada = formatarData(dataInicio);
  const dataFimFormatada = formatarData(dataFim);

  console.log("Datas formatadas para consulta:", {
    dataInicioFormatada,
    dataFimFormatada,
  });

  connection.query(
    `SELECT DATE_FORMAT(data_emprestimo, '%Y-%m') AS mes, COUNT(*) AS quantidade
     FROM Emprestimos
     WHERE data_emprestimo BETWEEN ? AND ?
     GROUP BY mes`,
    [dataInicioFormatada, dataFimFormatada],
    (err, livrosEmprestados) => {
      if (err) {
        console.error("Erro ao consultar livros emprestados:", err);
        return res.status(500).json({ error: "Erro ao gerar relatórios." });
      }
      console.log("Livros Emprestados:", livrosEmprestados);

      connection.query(
        `
        SELECT 
          CASE 
            WHEN TIMESTAMPDIFF(YEAR, u.data_nascimento, CURDATE()) < 18 THEN 'Menor de 18'
            WHEN TIMESTAMPDIFF(YEAR, u.data_nascimento, CURDATE()) BETWEEN 18 AND 24 THEN '18-24'
            WHEN TIMESTAMPDIFF(YEAR, u.data_nascimento, CURDATE()) BETWEEN 25 AND 34 THEN '25-34'
            WHEN TIMESTAMPDIFF(YEAR, u.data_nascimento, CURDATE()) BETWEEN 35 AND 44 THEN '35-44'
            ELSE '45+'
          END AS faixa_etaria,
          COUNT(DISTINCT u.id_usuario) AS quantidade
        FROM Usuario u
        JOIN Usuario_Emprestimos ue ON u.id_usuario = ue.fk_id_usuario
        JOIN Emprestimos e ON ue.fk_id_emprestimo = e.id_emprestimo
        WHERE e.data_emprestimo BETWEEN ? AND ?
        GROUP BY faixa_etaria
        `,
        [dataInicioFormatada, dataFimFormatada],
        (err, faixaEtaria) => {
          if (err) {
            console.error("Erro ao consultar faixa etária:", err);
            return res.status(500).json({ error: "Erro ao gerar relatórios." });
          }

          connection.query(
            `
            SELECT 
              u.nome_login AS usuario, 
              l.nome_livro AS livro, 
              e.data_prevista_devolucao AS dataPrevista, 
              e.status
            FROM Emprestimos e
            JOIN Usuario_Emprestimos ue ON e.id_emprestimo = ue.fk_id_emprestimo
            JOIN Usuario u ON ue.fk_id_usuario = u.id_usuario
            JOIN Livro l ON e.fk_id_livros = l.id_livro
            WHERE e.data_prevista_devolucao < NOW() AND e.status != 'concluido'
            `,
            (err, emprestimosAtrasados) => {
              if (err) {
                console.error("Erro ao consultar empréstimos atrasados:", err);
                return res
                  .status(500)
                  .json({ error: "Erro ao gerar relatórios." });
              }

              res.json({
                livrosEmprestados: livrosEmprestados || [],
                faixaEtaria: faixaEtaria || [],
                emprestimosAtrasados: emprestimosAtrasados || [],
              });
            }
          );
        }
      );
    }
  );
};

module.exports = { gerarRelatorios };
