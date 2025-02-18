"use client";

import { useState } from "react";
import styles from "./AdicionarIndicacoes.module.css";
import Input from "../forms/input";

const AdicionarIndicacao = () => {
  const [livroNome, setLivroNome] = useState("");
  const [livrosSugeridos, setLivrosSugeridos] = useState<any[]>([]);
  const [livroIdSelecionado, setLivroIdSelecionado] = useState<number | null>(null);

  // Função para buscar livros conforme o usuário digita
  const buscarLivros = async (nome: string) => {
    setLivroNome(nome);
    if (nome.length > 2) {
      const res = await fetch(`http://localhost:4000/api/livros/busca?nome=${nome}`);
      const data = await res.json();
      setLivrosSugeridos(data.livros);
    } else {
      setLivrosSugeridos([]);
    }
  };

  // Enviar Indicação
  const enviarIndicacao = async () => {
    if (!livroIdSelecionado) {
      alert("Selecione um livro antes de enviar a indicação!");
      return;
    }

    const response = await fetch("http://localhost:4000/api/indicacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fk_id_livro: livroIdSelecionado }),
    });

    if (response.ok) {
      alert("Indicação adicionada!");
      setLivroNome("");
      setLivrosSugeridos([]);
      setLivroIdSelecionado(null);
    }
  };

  return (
    <div className={styles.container}>
      <h2>Adicionar Indicação</h2>
      <Input
       label="Nome do Livro"
        type="text"
        value={livroNome}
        onChange={(e) => buscarLivros(e.target.value)}
        className={styles.input}
      />

      {/* Exibir Sugestões de Livros */}
      {livrosSugeridos.length > 0 && (
        <ul className={styles.sugestoes}>
          {livrosSugeridos.map((livro) => (
            <li
              key={livro.id_livro}
              onClick={() => {
                setLivroNome(livro.nome_livro);
                setLivroIdSelecionado(livro.id_livro);
                setLivrosSugeridos([]); 
              }}
              className={styles.sugestaoItem}
            >
              {livro.nome_livro}
            </li>
          ))}
        </ul>
      )}

      <button onClick={enviarIndicacao} className={styles.button}>Adicionar</button>
    </div>
  );
};

export default AdicionarIndicacao;
