// const connection = require("../config/mysql.config");
// const fs = require('fs');

// function list(request, response) {
//   connection.query(
//     `SELECT e.id_emprestimo, u.nome_login AS nome_usuario, l.id_livro, l.nome_livro AS nome_livro, l.foto_capa, e.data_prevista_devolucao, e.data_devolucao
//      FROM Emprestimos e
//      JOIN Usuario_Emprestimos ue ON e.id_emprestimo = ue.fk_id_emprestimo
//      JOIN Usuario u ON ue.fk_id_usuario = u.id_usuario
//      JOIN Livro l ON e.fk_id_livros = l.id_livro
//      WHERE e.data_devolucao IS NULL AND  e.status = 'aprovado'`,
//     function (err, resultado) {
//       if (err) {
//         return response.json({ erro: "Ocorreu um erro ao buscar os dados" });
//       }

//       resultado.forEach(emprestimo => {
//         if (emprestimo.foto_capa) {
//           emprestimo.foto_capa = `data:image/jpeg;base64,${Buffer.from(emprestimo.foto_capa).toString('base64')}`;
//         }
//       });

//       return response.json({ dados: resultado });
//     }
//   );
// }

// function emprestimoAprovar(request, response){
//   connection.query(
//     `SELECT e.id_emprestimo, u.nome_login AS nome_usuario, l.nome_livro AS nome_livro, l.foto_capa, e.data_prevista_devolucao, e.data_devolucao
//      FROM Emprestimos e
//      JOIN Usuario_Emprestimos ue ON e.id_emprestimo = ue.fk_id_emprestimo
//      JOIN Usuario u ON ue.fk_id_usuario = u.id_usuario
//      JOIN Livro l ON e.fk_id_livros = l.id_livro
//      WHERE e.status = 'pendente'`,
//     function (err, resultado) {
//       if (err) {
//         return response.json({ erro: "Ocorreu um erro ao buscar os dados" });
//       }

//       resultado.forEach(emprestimo => {
//         if (emprestimo.foto_capa) {
//           emprestimo.foto_capa = `data:image/jpeg;base64,${Buffer.from(emprestimo.foto_capa).toString('base64')}`;
//         }
//       });

//       return response.json({ dados: resultado });
//     }
//   );
// }


// function show(request, response) {
//   const idEmprestimo = request.params.id;

//   connection.query(
//     `SELECT e.id_emprestimo, u.nome_login AS nome_usuario, l.nome_livro AS nome_livro, l.foto_capa, e.data_prevista_devolucao, e.data_emprestimo, e.data_devolucao
//      FROM Emprestimos e
//      JOIN Usuario_Emprestimos ue ON e.id_emprestimo = ue.fk_id_emprestimo
//      JOIN Usuario u ON ue.fk_id_usuario = u.id_usuario
//      JOIN Livro l ON e.fk_id_livros = l.id_livro
//      WHERE e.id_emprestimo = ?`,
//     [idEmprestimo],
//     function (err, resultado) {
//       if (err) {
//         return response.json({ erro: "Erro ao buscar detalhes do empréstimo." });
//       }

//       if (resultado.length === 0) {
//         return response.json({ erro: "Empréstimo não encontrado." });
//       }

//       let emprestimo = resultado[0];
//       if (emprestimo.foto_capa) {
//         emprestimo.foto_capa = `data:image/jpeg;base64,${Buffer.from(emprestimo.foto_capa).toString('base64')}`;
//       }

//       return response.json({ dados: emprestimo });
//     }
//   );
// }

// function reservar(request, response) {
//   const livroId = request.params.id;
//   const usuarioId = request.body.usuarioId;

//   connection.query(
//     "SELECT quantidade_estoque FROM Estoque WHERE id_estoque = (SELECT fk_id_estoque FROM Livro WHERE id_livro = ?)",
//     [livroId],
//     function (err, resultado) {
//       if (err || resultado.length === 0 || resultado[0].quantidade_estoque <= 0) {
//         return response.json({ erro: "Erro ao reservar livro ou livro indisponível." });
//       }

//       // Diminui o estoque em 1
//       connection.query(
//         "UPDATE Estoque SET quantidade_estoque = quantidade_estoque - 1 WHERE id_estoque = (SELECT fk_id_estoque FROM Livro WHERE id_livro = ?)",
//         [livroId],
//         function (err) {
//           if (err) {
//             return response.json({ erro: "Erro ao atualizar o estoque." });
//           }

//           // Insere a reserva com status "pendente"
//           connection.query(
//             "INSERT INTO Emprestimos (fk_id_livros, data_emprestimo, data_prevista_devolucao, status) VALUES (?, NULL, NULL, 'pendente')",
//             [livroId],
//             function (err, emprestimoResult) {
//               if (err) {
//                 return response.json({ erro: "Erro ao registrar a reserva." });
//               }

//               const emprestimoId = emprestimoResult.insertId;

//               // Associa o usuário à reserva
//               connection.query(
//                 "INSERT INTO Usuario_Emprestimos (fk_id_usuario, fk_id_emprestimo) VALUES (?, ?)",
//                 [usuarioId, emprestimoId],
//                 function (err) {
//                   if (err) {
//                     return response.json({ erro: "Erro ao associar usuário ao empréstimo." });
//                   }
//                   return response.json({ mensagem: "Reserva solicitada com sucesso." });
//                 }
//               );
//             }
//           );
//         }
//       );
//     }
//   );
// }

// function aprovarReserva(request, response) {
//   const idEmprestimo = request.params.id;
//   const dataAtual = new Date();
//   const dataPrevistaDevolucao = new Date(dataAtual);
//   dataPrevistaDevolucao.setDate(dataAtual.getDate() + 30);

//   connection.query(
//     "SELECT fk_id_livros FROM Emprestimos WHERE id_emprestimo = ? AND status = 'pendente'",
//     [idEmprestimo],
//     function (err, resultado) {
//       if (err || resultado.length === 0) {
//         return response.json({ erro: "Reserva não encontrada ou já aprovada." });
//       }

//       // Atualiza o empréstimo para "aprovado" e define as datas
//       connection.query(
//         "UPDATE Emprestimos SET status = 'aprovado', data_emprestimo = ?, data_prevista_devolucao = ? WHERE id_emprestimo = ?",
//         [dataAtual, dataPrevistaDevolucao, idEmprestimo],
//         function (err) {
//           if (err) {
//             return response.json({ erro: "Erro ao aprovar a reserva." });
//           }
//           return response.json({ mensagem: "Reserva aprovada com sucesso." });
//         }
//       );
//     }
//   );
// }

// function rejeitarReserva(request, response) {
//   const idEmprestimo = request.params.id;

//   connection.query(
//     "SELECT fk_id_livros FROM Emprestimos WHERE id_emprestimo = ? AND status = 'pendente'",
//     [idEmprestimo],
//     function (err, resultado) {
//       if (err || resultado.length === 0) {
//         return response.json({ erro: "Reserva não encontrada ou já processada." });
//       }

//       const livroId = resultado[0].fk_id_livros;

//       // Aumenta o estoque em 1 para desfazer a reserva
//       connection.query(
//         "UPDATE Estoque SET quantidade_estoque = quantidade_estoque + 1 WHERE id_estoque = (SELECT fk_id_estoque FROM Livro WHERE id_livro = ?)",
//         [livroId],
//         function (err) {
//           if (err) {
//             return response.json({ erro: "Erro ao atualizar o estoque." });
//           }

//           // Atualiza o empréstimo para "rejeitado"
//           connection.query(
//             "UPDATE Emprestimos SET status = 'rejeitado' WHERE id_emprestimo = ?",
//             [idEmprestimo],
//             function (err) {
//               if (err) {
//                 return response.json({ erro: "Erro ao rejeitar a reserva." });
//               }
//               return response.json({ mensagem: "Reserva rejeitada e estoque atualizado." });
//             }
//           );
//         }
//       );
//     }
//   );
// }

// function devolver(request, response) {
//   const idEmprestimo = request.params.id;
//   const dataAtual = new Date();

//   connection.query(
//     "SELECT fk_id_livros FROM Emprestimos WHERE id_emprestimo = ?",
//     [idEmprestimo],
//     function (err, resultado) {
//       if (err || resultado.length === 0) {
//         return response.json({ erro: "Erro ao obter o livro do empréstimo ou empréstimo não encontrado." });
//       }

//       const idLivro = resultado[0].fk_id_livros;

//       connection.query(
//         "UPDATE Estoque SET quantidade_estoque = quantidade_estoque + 1 WHERE id_estoque = (SELECT fk_id_estoque FROM Livro WHERE id_livro = ?)",
//         [idLivro],
//         function (err) {
//           if (err) {
//             return response.json({ erro: "Erro ao atualizar a quantidade do livro." });
//           }

//           connection.query(
//             "UPDATE Emprestimos SET data_devolucao = ?, status = 'concluido' WHERE id_emprestimo = ?",
//             [dataAtual, idEmprestimo],
//             function (err) {
//               if (err) {
//                 return response.json({ erro: "Erro ao atualizar a data de devolução." });
//               }

//               connection.query(
//                 "INSERT INTO Historico (data_historico, fk_id_livros, fk_id_emprestimo) VALUES (?, ?, ?)",
//                 [dataAtual, idLivro, idEmprestimo],
//                 function (err) {
//                   if (err) {
//                     return response.json({ erro: "Erro ao registrar o histórico de devolução." });
//                   }
//                   return response.json({ mensagem: "Livro devolvido com sucesso." });
//                 }
//               );
//             }
//           );
//         }
//       );
//     }
//   );
// }

// function listarHistorico(req, res) {
//   const { idUsuario } = req.params;

//   connection.query(
//     `SELECT 
//       h.id_historico,
//       h.data_historico,
//       l.nome_livro,
//       l.foto_capa,
//       e.data_emprestimo,
//       e.data_prevista_devolucao,
//       e.data_devolucao
//     FROM Historico AS h
//     JOIN Livro AS l ON h.fk_id_livros = l.id_livro
//     JOIN Emprestimos AS e ON h.fk_id_emprestimo = e.id_emprestimo
//     JOIN Usuario_Emprestimos AS ue ON ue.fk_id_emprestimo = e.id_emprestimo
//     WHERE ue.fk_id_usuario = ?
//     ORDER BY h.data_historico DESC`,
//     [idUsuario],
//     (error, results) => {
//       if (error) {
//         console.error("Erro ao buscar histórico:", error);
//         return res.status(500).json({ error: "Erro ao buscar histórico." });
//       }

//       if (results.length === 0) {
//         return res.status(404).json({ mensagem: "Nenhum histórico encontrado." });
//       }

//       // Convertendo a foto (BLOB) para base64
//       const formattedResults = results.map((result) => ({
//         ...result,
//         foto_capa: result.foto_capa
//           ? `data:image/jpeg;base64,${Buffer.from(result.foto_capa).toString(
//               "base64"
//             )}`
//           : null,
//       }));

//       res.json(formattedResults);
//     }
//   );
// }


// module.exports = { list, show, reservar, devolver, aprovarReserva, rejeitarReserva, emprestimoAprovar, listarHistorico };





const connection = require("../config/mysql.config");
// const fs = require('fs'); // não é mais necessário para imagem

function list(request, response) {
  const sql = `
    SELECT 
      e.id_emprestimo,
      u.nome_login AS nome_usuario,
      l.id_livro,
      l.nome_livro AS nome_livro,
      l.foto_capa_url,
      e.data_prevista_devolucao,
      e.data_devolucao
    FROM Emprestimos e
    JOIN Usuario_Emprestimos ue ON e.id_emprestimo = ue.fk_id_emprestimo
    JOIN Usuario u ON ue.fk_id_usuario = u.id_usuario
    JOIN Livro l ON e.fk_id_livros = l.id_livro
    WHERE e.data_devolucao IS NULL AND e.status = 'aprovado'
    ORDER BY e.id_emprestimo DESC
  `;

  connection.query(sql, function (err, resultado) {
    if (err) {
      return response.json({ erro: "Ocorreu um erro ao buscar os dados" });
    }

    const dados = resultado.map((row) => {
      const url = row.foto_capa_url || null;
      return {
        ...row,
        foto_capa_url: url,
        foto_capa: url, // compat
        capa: url,      // compat
      };
    });

    return response.json({ dados });
  });
}

function emprestimoAprovar(request, response) {
  const sql = `
    SELECT 
      e.id_emprestimo,
      u.nome_login AS nome_usuario,
      l.nome_livro AS nome_livro,
      l.foto_capa_url,
      e.data_prevista_devolucao,
      e.data_devolucao
    FROM Emprestimos e
    JOIN Usuario_Emprestimos ue ON e.id_emprestimo = ue.fk_id_emprestimo
    JOIN Usuario u ON ue.fk_id_usuario = u.id_usuario
    JOIN Livro l ON e.fk_id_livros = l.id_livro
    WHERE e.status = 'pendente'
    ORDER BY e.id_emprestimo DESC
  `;

  connection.query(sql, function (err, resultado) {
    if (err) {
      return response.json({ erro: "Ocorreu um erro ao buscar os dados" });
    }

    const dados = resultado.map((row) => {
      const url = row.foto_capa_url || null;
      return {
        ...row,
        foto_capa_url: url,
        foto_capa: url, // compat
        capa: url,      // compat
      };
    });

    return response.json({ dados });
  });
}

function show(request, response) {
  const idEmprestimo = request.params.id;

  const sql = `
    SELECT 
      e.id_emprestimo,
      u.nome_login AS nome_usuario,
      l.nome_livro AS nome_livro,
      l.foto_capa_url,
      e.data_prevista_devolucao,
      e.data_emprestimo,
      e.data_devolucao
    FROM Emprestimos e
    JOIN Usuario_Emprestimos ue ON e.id_emprestimo = ue.fk_id_emprestimo
    JOIN Usuario u ON ue.fk_id_usuario = u.id_usuario
    JOIN Livro l ON e.fk_id_livros = l.id_livro
    WHERE e.id_emprestimo = ?
  `;

  connection.query(sql, [idEmprestimo], function (err, resultado) {
    if (err) {
      return response.json({ erro: "Erro ao buscar detalhes do empréstimo." });
    }

    if (resultado.length === 0) {
      return response.json({ erro: "Empréstimo não encontrado." });
    }

    const row = resultado[0];
    const url = row.foto_capa_url || null;

    const dados = {
      ...row,
      foto_capa_url: url,
      foto_capa: url, // compat
      capa: url,      // compat
    };

    return response.json({ dados });
  });
}

function reservar(request, response) {
  const livroId = request.params.id;
  const usuarioId = request.body.usuarioId;

  connection.query(
    "SELECT quantidade_estoque FROM Estoque WHERE id_estoque = (SELECT fk_id_estoque FROM Livro WHERE id_livro = ?)",
    [livroId],
    function (err, resultado) {
      if (err || resultado.length === 0 || resultado[0].quantidade_estoque <= 0) {
        return response.json({ erro: "Erro ao reservar livro ou livro indisponível." });
      }

      // Diminui o estoque em 1
      connection.query(
        "UPDATE Estoque SET quantidade_estoque = quantidade_estoque - 1 WHERE id_estoque = (SELECT fk_id_estoque FROM Livro WHERE id_livro = ?)",
        [livroId],
        function (err) {
          if (err) {
            return response.json({ erro: "Erro ao atualizar o estoque." });
          }

          // Insere a reserva com status "pendente"
          connection.query(
            "INSERT INTO Emprestimos (fk_id_livros, data_emprestimo, data_prevista_devolucao, status) VALUES (?, NULL, NULL, 'pendente')",
            [livroId],
            function (err, emprestimoResult) {
              if (err) {
                return response.json({ erro: "Erro ao registrar a reserva." });
              }

              const emprestimoId = emprestimoResult.insertId;

              // Associa o usuário à reserva
              connection.query(
                "INSERT INTO Usuario_Emprestimos (fk_id_usuario, fk_id_emprestimo) VALUES (?, ?)",
                [usuarioId, emprestimoId],
                function (err) {
                  if (err) {
                    return response.json({ erro: "Erro ao associar usuário ao empréstimo." });
                  }
                  return response.json({ mensagem: "Reserva solicitada com sucesso." });
                }
              );
            }
          );
        }
      );
    }
  );
}

function aprovarReserva(request, response) {
  const idEmprestimo = request.params.id;
  const dataAtual = new Date();
  const dataPrevistaDevolucao = new Date(dataAtual);
  dataPrevistaDevolucao.setDate(dataAtual.getDate() + 30);

  connection.query(
    "SELECT fk_id_livros FROM Emprestimos WHERE id_emprestimo = ? AND status = 'pendente'",
    [idEmprestimo],
    function (err, resultado) {
      if (err || resultado.length === 0) {
        return response.json({ erro: "Reserva não encontrada ou já aprovada." });
      }

      connection.query(
        "UPDATE Emprestimos SET status = 'aprovado', data_emprestimo = ?, data_prevista_devolucao = ? WHERE id_emprestimo = ?",
        [dataAtual, dataPrevistaDevolucao, idEmprestimo],
        function (err) {
          if (err) {
            return response.json({ erro: "Erro ao aprovar a reserva." });
          }
          return response.json({ mensagem: "Reserva aprovada com sucesso." });
        }
      );
    }
  );
}

function rejeitarReserva(request, response) {
  const idEmprestimo = request.params.id;

  connection.query(
    "SELECT fk_id_livros FROM Emprestimos WHERE id_emprestimo = ? AND status = 'pendente'",
    [idEmprestimo],
    function (err, resultado) {
      if (err || resultado.length === 0) {
        return response.json({ erro: "Reserva não encontrada ou já processada." });
      }

      const livroId = resultado[0].fk_id_livros;

      connection.query(
        "UPDATE Estoque SET quantidade_estoque = quantidade_estoque + 1 WHERE id_estoque = (SELECT fk_id_estoque FROM Livro WHERE id_livro = ?)",
        [livroId],
        function (err) {
          if (err) {
            return response.json({ erro: "Erro ao atualizar o estoque." });
          }

          connection.query(
            "UPDATE Emprestimos SET status = 'rejeitado' WHERE id_emprestimo = ?",
            [idEmprestimo],
            function (err) {
              if (err) {
                return response.json({ erro: "Erro ao rejeitar a reserva." });
              }
              return response.json({ mensagem: "Reserva rejeitada e estoque atualizado." });
            }
          );
        }
      );
    }
  );
}

function devolver(request, response) {
  const idEmprestimo = request.params.id;
  const dataAtual = new Date();

  connection.query(
    "SELECT fk_id_livros FROM Emprestimos WHERE id_emprestimo = ?",
    [idEmprestimo],
    function (err, resultado) {
      if (err || resultado.length === 0) {
        return response.json({ erro: "Erro ao obter o livro do empréstimo ou empréstimo não encontrado." });
      }

      const idLivro = resultado[0].fk_id_livros;

      connection.query(
        "UPDATE Estoque SET quantidade_estoque = quantidade_estoque + 1 WHERE id_estoque = (SELECT fk_id_estoque FROM Livro WHERE id_livro = ?)",
        [idLivro],
        function (err) {
          if (err) {
            return response.json({ erro: "Erro ao atualizar a quantidade do livro." });
          }

          connection.query(
            "UPDATE Emprestimos SET data_devolucao = ?, status = 'concluido' WHERE id_emprestimo = ?",
            [dataAtual, idEmprestimo],
            function (err) {
              if (err) {
                return response.json({ erro: "Erro ao atualizar a data de devolução." });
              }

              connection.query(
                "INSERT INTO Historico (data_historico, fk_id_livros, fk_id_emprestimo) VALUES (?, ?, ?)",
                [dataAtual, idLivro, idEmprestimo],
                function (err) {
                  if (err) {
                    return response.json({ erro: "Erro ao registrar o histórico de devolução." });
                  }
                  return response.json({ mensagem: "Livro devolvido com sucesso." });
                }
              );
            }
          );
        }
      );
    }
  );
}

function listarHistorico(req, res) {
  const { idUsuario } = req.params;

  const sql = `
    SELECT 
      h.id_historico,
      h.data_historico,
      l.nome_livro,
      l.foto_capa_url,
      e.data_emprestimo,
      e.data_prevista_devolucao,
      e.data_devolucao
    FROM Historico AS h
    JOIN Livro AS l ON h.fk_id_livros = l.id_livro
    JOIN Emprestimos AS e ON h.fk_id_emprestimo = e.id_emprestimo
    JOIN Usuario_Emprestimos AS ue ON ue.fk_id_emprestimo = e.id_emprestimo
    WHERE ue.fk_id_usuario = ?
    ORDER BY h.data_historico DESC
  `;

  connection.query(sql, [idUsuario], (error, results) => {
    if (error) {
      console.error("Erro ao buscar histórico:", error);
      return res.status(500).json({ error: "Erro ao buscar histórico." });
    }

    if (results.length === 0) {
      return res.status(404).json({ mensagem: "Nenhum histórico encontrado." });
    }

    const dados = results.map((row) => {
      const url = row.foto_capa_url || null;
      return {
        ...row,
        foto_capa_url: url,
        foto_capa: url, // compat
        capa: url,      // compat
      };
    });

    res.json(dados);
  });
}

module.exports = { 
  list, 
  show, 
  reservar, 
  devolver, 
  aprovarReserva, 
  rejeitarReserva, 
  emprestimoAprovar, 
  listarHistorico 
};
