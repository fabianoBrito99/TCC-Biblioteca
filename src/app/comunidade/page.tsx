"use client";
import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/comunidade/comunidade.module.css";
import Input from "@/componentes/forms/input";
import Button from "@/componentes/forms/button";

interface Comunidade {
  id_comunidade: number;
  nome: string;
  descricao: string;
  tipo: string;
}

export default function ComunidadeListPage() {
  const [comunidades, setComunidades] = useState<Comunidade[]>([]);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [tipo, setTipo] = useState("publica");
  const [userId, setUserId] = useState<number | null>(null); // Armazena o ID do usuário logado
  const router = useRouter();
  const [comunidade, setComunidade] = useState<Comunidade | null>(null);
  const [mensagem, setMensagem] = useState<string>("");

  useEffect(() => {
    const fetchComunidade = async () => {
      const response = await fetch("http://localhost:4000/api/comunidade/1");
      const data = await response.json();

      if (data.message) {
        setMensagem(data.message); // Exibe mensagem caso não existam comunidades
      } else {
        setComunidade(data);
      }
    };
    fetchComunidade();
  }, []);

  // Obtém o ID do usuário logado do localStorage
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(parseInt(storedUserId));
    }
  }, []);

  // Função para criar uma nova comunidade
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      alert("Usuário não está logado.");
      return;
    }

    // Verifica os dados enviados
    const comunidadeData = {
      nome,
      descricao,
      objetivo,
      tipo,
      id_adm: userId,
    };
    console.log("Dados enviados para criação de comunidade:", comunidadeData);

    const response = await fetch("http://localhost:4000/api/comunidade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(comunidadeData),
    });

    if (response.ok) {
      alert("Comunidade criada com sucesso!");
      fetchComunidades(); // Atualiza a lista de comunidades
    } else {
      const errorData = await response.json();
      console.error("Erro ao criar a comunidade:", errorData);
      alert("Erro ao criar a comunidade");
    }
  };

  // Função para carregar todas as comunidades
  const fetchComunidades = async () => {
    const response = await fetch("http://localhost:4000/api/comunidade");
    const data = await response.json();
    console.log(data); // Verifique a estrutura da resposta
    if (Array.isArray(data)) {
      setComunidades(data);
    } else {
      console.error("Resposta inválida da API", data);
    }
  };

  useEffect(() => {
    fetchComunidades();
  }, []);

  // Função para o usuário entrar em uma comunidade
  const handleEntrar = async (comunidadeId: number, tipo: string) => {
    if (!userId) {
      alert("Usuário não está logado.");
      return;
    }

    await fetch(`http://localhost:4000/api/comunidade/${comunidadeId}/entrar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fk_id_usuario: userId, tipo }),
    });

    if (tipo === "publica") {
      router.push(`/comunidade/${comunidadeId}`);
    } else {
      alert("Solicitação pendente de aprovação");
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.criarComunidade}>
        <h1 className={styles.titleCriar}>Criar Comunidade</h1>
        <form onSubmit={handleSubmit} className={styles.form}>
          <Input
            label="Nome da Comunidade"
            type="text"
            name="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />

          <Input
            label="Descrição"
            type="text"
            name="descricao"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />

          <Input
            label="Objetivo"
            type="text"
            name="objetivo"
            value={objetivo}
            onChange={(e) => setObjetivo(e.target.value)}
          />

          <label>
            Tipo
            <select value={tipo} onChange={(e) => setTipo(e.target.value)}>
              <option value="publica">Pública</option>
              <option value="privada">Privada</option>
            </select>
          </label>

          <Button type="submit">Criar Comunidade</Button>
        </form>
      </div>

      <div className={styles.listaComunidade}>
        <h1 className={styles.titleCom}>Comunidades</h1>
        {mensagem ? (
          <h2>{mensagem}</h2>
        ) : (
          comunidades.map((comunidade) => (
            <div
              key={comunidade.id_comunidade}
              className={styles.comunidadeCard}
            >
              <h2>{comunidade.nome}</h2>
              <p>{comunidade.descricao}</p>
              <button
                onClick={() =>
                  handleEntrar(comunidade.id_comunidade, comunidade.tipo)
                }
              >
                {comunidade.tipo === "publica" ? "Entrar" : "Solicitar Entrada"}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
