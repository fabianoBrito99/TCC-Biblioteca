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

interface StatusUsuario {
  [id_comunidade: number]: "nao_inscrito" | "pendente" | "aceito";
}

export default function ComunidadeListPage() {
  const [comunidades, setComunidades] = useState<Comunidade[]>([]);
  const [statusUsuario, setStatusUsuario] = useState<StatusUsuario>({});
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [tipo, setTipo] = useState("publica");
  const [userId, setUserId] = useState<number | null>(null);
  const router = useRouter();

  // Obtém o ID do usuário logado do localStorage
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(parseInt(storedUserId));
    }
  }, []);

  // Função para carregar comunidades e status do usuário
  useEffect(() => {
    const fetchComunidades = async () => {
      try {
        const response = await fetch("http://localhost:4000/api/comunidade");
        const data = await response.json();

        if (Array.isArray(data)) {
          setComunidades(data);

          if (userId) {
            // Verifica o status do usuário para cada comunidade
            const statuses: StatusUsuario = {};
            for (const comunidade of data) {
              const statusResponse = await fetch(
                `http://localhost:4000/api/comunidade/${comunidade.id_comunidade}/usuario/${userId}/status`
              );
              const statusData = await statusResponse.json();
              statuses[comunidade.id_comunidade] = statusData.status;
            }
            setStatusUsuario(statuses);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar comunidades:", error);
      }
    };

    if (userId) {
      fetchComunidades();
    }
  }, [userId]);

  // Função para criar uma nova comunidade
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!userId) {
      alert("Usuário não está logado.");
      return;
    }

    const comunidadeData = {
      nome,
      descricao,
      objetivo,
      tipo,
      id_adm: userId,
    };

    const response = await fetch("http://localhost:4000/api/comunidade", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(comunidadeData),
    });

    if (response.ok) {
      const { id } = await response.json();

      // Adicionar automaticamente o administrador à comunidade
      await fetch(`http://localhost:4000/api/comunidade/${id}/entrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fk_id_usuario: userId, tipo: "publica" }),
      });

      alert("Comunidade criada com sucesso!");
      setStatusUsuario((prev) => ({
        ...prev,
        [id]: "aceito",
      }));
      fetchComunidades();
    } else {
      alert("Erro ao criar a comunidade");
    }
  };

  // Função para entrar em uma comunidade
  const handleEntrar = async (comunidadeId: number, tipo: string) => {
    if (!userId) {
      alert("Usuário não está logado.");
      return;
    }

    const status = statusUsuario[comunidadeId] || "nao_inscrito";

    if (status === "aceito") {
      router.push(`/comunidade/${comunidadeId}`);
      return;
    }

    if (status === "pendente") {
      alert("Solicitação pendente de aprovação.");
      return;
    }

    await fetch(`http://localhost:4000/api/comunidade/${comunidadeId}/entrar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fk_id_usuario: userId, tipo }),
    });

    if (tipo === "publica") {
      router.push(`/comunidade/${comunidadeId}`);
      setStatusUsuario((prev) => ({
        ...prev,
        [comunidadeId]: "aceito",
      }));
    } else {
      alert("Solicitação enviada. Aguardando aprovação.");
      setStatusUsuario((prev) => ({
        ...prev,
        [comunidadeId]: "pendente",
      }));
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
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
          <Input
            label="Descrição"
            type="text"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
          <Input
            label="Objetivo"
            type="text"
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
        {comunidades.map((comunidade) => {
          const status = statusUsuario[comunidade.id_comunidade] || "nao_inscrito";

          return (
            <div key={comunidade.id_comunidade} className={styles.comunidadeCard}>
              <h2>{comunidade.nome}</h2>
              <p>{comunidade.descricao}</p>
              <button
                onClick={() =>
                  handleEntrar(comunidade.id_comunidade, comunidade.tipo)
                }
              >
                {status === "nao_inscrito"
                  ? comunidade.tipo === "publica"
                    ? "Entrar"
                    : "Solicitar Entrada"
                  : status === "pendente"
                  ? "Solicitado"
                  : "Acessar"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
