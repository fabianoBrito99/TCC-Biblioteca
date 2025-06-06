const connection = require("../config/mysql.config");

const gerarRelatorios = (req, res) => {
  const { dataInicio, dataFim } = req.query;

  const formatarData = (data) => {
    // Se já estiver no formato correto, apenas retorna
    if (data.includes("-")) return data;
  
    const [ano, mes, dia] = data.split("/");
    return `${ano}-${mes}-${dia}`;
  };
  

  const dataInicioFormatada = formatarData(dataInicio);
  const dataFimFormatada = formatarData(dataFim);

  const diasDiff = Math.ceil(
    (new Date(dataFimFormatada) - new Date(dataInicioFormatada)) / (1000 * 60 * 60 * 24)
  );
  const dataInicioAnterior = new Date(new Date(dataInicioFormatada).getTime() - diasDiff * 24 * 60 * 60 * 1000)
    .toISOString().split("T")[0];
  const dataFimAnterior = new Date(new Date(dataFimFormatada).getTime() - diasDiff * 24 * 60 * 60 * 1000)
    .toISOString().split("T")[0];

  console.log("Datas formatadas:", {
    atual: [dataInicioFormatada, dataFimFormatada],
    anterior: [dataInicioAnterior, dataFimAnterior],
  });

  connection.query(
    `SELECT DATE_FORMAT(data_emprestimo, '%Y-%m') AS mes, COUNT(*) AS quantidade
     FROM Emprestimos
     WHERE data_emprestimo BETWEEN ? AND ?
     GROUP BY mes`,
    [dataInicioFormatada, dataFimFormatada],
    (err, livrosEmprestados) => {
      if (err) return res.status(500).json({ error: "Erro ao buscar livros emprestados." });

      connection.query(
        `SELECT 
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
         GROUP BY faixa_etaria`,
        [dataInicioFormatada, dataFimFormatada],
        (err, faixaEtaria) => {
          if (err) return res.status(500).json({ error: "Erro ao buscar faixa etária." });

          connection.query(
            `SELECT 
                u.nome_login AS usuario, 
                l.nome_livro AS livro, 
                e.data_prevista_devolucao AS dataPrevista, 
                e.status
             FROM Emprestimos e
             JOIN Usuario_Emprestimos ue ON e.id_emprestimo = ue.fk_id_emprestimo
             JOIN Usuario u ON ue.fk_id_usuario = u.id_usuario
             JOIN Livro l ON e.fk_id_livros = l.id_livro
             WHERE e.data_prevista_devolucao < NOW() AND e.status != 'concluido'`,
            (err, emprestimosAtrasados) => {
              if (err) return res.status(500).json({ error: "Erro ao buscar empréstimos atrasados." });

              connection.query(
                `SELECT COUNT(*) AS totalLivros
                 FROM Emprestimos
                 WHERE data_emprestimo BETWEEN ? AND ?`,
                [dataInicioFormatada, dataFimFormatada],
                (err, totalLivrosResult) => {
                  if (err) return res.status(500).json({ error: "Erro ao buscar total de livros." });

                  const totalLivros = totalLivrosResult[0]?.totalLivros || 0;

                  connection.query(
                    `SELECT COUNT(*) AS totalAnterior
                     FROM Emprestimos
                     WHERE data_emprestimo BETWEEN ? AND ?`,
                    [dataInicioAnterior, dataFimAnterior],
                    (err, totalAnteriorResult) => {
                      if (err) return res.status(500).json({ error: "Erro ao buscar total anterior." });

                      const totalAnterior = totalAnteriorResult[0]?.totalAnterior || 0;

                      connection.query(
                        `SELECT l.nome_livro, COUNT(*) AS quantidade
                         FROM Emprestimos e
                         JOIN Livro l ON e.fk_id_livros = l.id_livro
                         WHERE e.data_emprestimo BETWEEN ? AND ?
                         GROUP BY l.nome_livro
                         ORDER BY quantidade DESC
                         LIMIT 5`,
                        [dataInicioFormatada, dataFimFormatada],
                        (err, topLivros) => {
                          if (err) return res.status(500).json({ error: "Erro ao buscar top livros." });

                          connection.query(
                            `SELECT u.nome_login, COUNT(*) AS quantidade
                             FROM Usuario u
                             JOIN Usuario_Emprestimos ue ON u.id_usuario = ue.fk_id_usuario
                             JOIN Emprestimos e ON ue.fk_id_emprestimo = e.id_emprestimo
                             WHERE e.data_emprestimo BETWEEN ? AND ?
                             GROUP BY u.nome_login
                             ORDER BY quantidade DESC
                             LIMIT 5`,
                            [dataInicioFormatada, dataFimFormatada],
                            (err, topLeitores) => {
                              if (err) return res.status(500).json({ error: "Erro ao buscar top leitores." });

                              connection.query(
                                `SELECT COALESCE(a.nome, 'Desconhecido') AS nome_autor, COUNT(*) AS quantidade
                                 FROM Emprestimos e
                                 JOIN Livro l ON e.fk_id_livros = l.id_livro
                                 LEFT JOIN autor_livros al ON l.id_livro = al.fk_id_livros
                                 LEFT JOIN Autor a ON al.fk_id_autor = a.id_autor
                                 WHERE e.data_emprestimo BETWEEN ? AND ?
                                 GROUP BY nome_autor
                                 ORDER BY quantidade DESC
                                 LIMIT 5`,
                                [dataInicioFormatada, dataFimFormatada],
                                (err, topAutores) => {
                                  if (err) {
                                    console.error("Erro ao buscar top autores:", err);
                                    return res.status(500).json({ error: "Erro ao buscar top autores." });
                                  }
                              

                                  connection.query(
                                    `SELECT c.categoria_principal, COUNT(*) AS quantidade
                                     FROM Emprestimos e
                                     JOIN Livro l ON e.fk_id_livros = l.id_livro
                                     JOIN livro_categoria cl ON l.id_livro = cl.fk_id_livros
                                     JOIN Categoria c ON cl.fk_id_categoria = c.id_categoria
                                     WHERE e.data_emprestimo BETWEEN ? AND ?
                                     GROUP BY c.categoria_principal
                                     ORDER BY quantidade DESC
                                     LIMIT 5`,
                                    [dataInicioFormatada, dataFimFormatada],
                                    (err, topCategorias) => {
                                      if (err) {
                                        console.error("Erro ao buscar top categorias:", err);
                                        return res.status(500).json({ error: "Erro ao buscar top categorias." });
                                      }
                                  
                                    
                                  

                                      connection.query(
                                        `SELECT u.sexo, COUNT(*) AS quantidade
                                         FROM Usuario u
                                         JOIN Usuario_Emprestimos ue ON u.id_usuario = ue.fk_id_usuario
                                         JOIN Emprestimos e ON ue.fk_id_emprestimo = e.id_emprestimo
                                         WHERE e.data_emprestimo BETWEEN ? AND ?
                                         GROUP BY u.sexo`,
                                        [dataInicioFormatada, dataFimFormatada],
                                        (err, leituraPorSexo) => {
                                          if (err) return res.status(500).json({ error: "Erro ao buscar leitura por sexo." });

                                          // ✅ RESPOSTA FINAL
                                          res.json({
                                            livrosEmprestados: livrosEmprestados || [],
                                            faixaEtaria: faixaEtaria || [],
                                            emprestimosAtrasados: emprestimosAtrasados || [],
                                            totalLivros,
                                            totalAnterior,
                                            topLivros,
                                            topLeitores,
                                            topAutores,
                                            topCategorias,
                                            leituraPorSexo
                                          });
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
                  );
                }
              );
            }
          );
        }
      );
    }
  );
};

module.exports = { gerarRelatorios };
