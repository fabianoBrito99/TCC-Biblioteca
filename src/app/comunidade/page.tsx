"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import styles from "@/app/comunidade/comunidade.module.css";
import Input from "@/componentes/forms/input";
import Button from "@/componentes/forms/button";

const API_BASE = "https://api.helenaramazzotte.online/api";

interface Comunidade {
  id_comunidade: number;
  slug: string;
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
  const [objetivo, ] = useState("");
  const [tipo, setTipo] = useState("publica");
  const [userId, setUserId] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();

  // Obtém o ID do usuário logado do localStorage
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    const storedToken = localStorage.getItem("token");
    if (storedUserId) {
      setUserId(parseInt(storedUserId));
    }
    setToken(storedToken);
  }, []);

  // Função para carregar comunidades e status do usuário
  const fetchComunidades = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/comunidade`);
      const data = await response.json();

      if (Array.isArray(data)) {
        setComunidades(data);

        if (userId) {
          const statuses: StatusUsuario = {};
          for (const comunidade of data) {
            const statusResponse = await fetch(
              `${API_BASE}/comunidade/${comunidade.id_comunidade}/usuario/${userId}/status`
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
  }, [userId]); // Dependência de userId

  useEffect(() => {
    if (userId) {
      fetchComunidades();
    }
  }, [userId, fetchComunidades]);


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
    };

    const token = localStorage.getItem("token");
    const response = await fetch(`${API_BASE}/comunidade`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(comunidadeData),
    });

    if (response.ok) {
      const { id, slug } = await response.json();

      alert("Comunidade criada com sucesso!");
      setStatusUsuario((prev) => ({
        ...prev,
        [id]: "aceito",
      }));
      fetchComunidades();
      router.push(`/comunidade/${slug || `comunidade-${id}`}`);
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
      const comunidade = comunidades.find((c) => c.id_comunidade === comunidadeId);
      if (comunidade?.slug) {
        router.push(`/comunidade/${comunidade.slug}`);
      }
      return;
    }

    if (status === "pendente") {
      alert("Solicitação pendente de aprovação.");
      return;
    }

    const token = localStorage.getItem("token");
    await fetch(`${API_BASE}/comunidade/${comunidadeId}/entrar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ tipo }),
    });

    if (tipo === "publica") {
      const comunidade = comunidades.find((c) => c.id_comunidade === comunidadeId);
      if (comunidade?.slug) {
        router.push(`/comunidade/${comunidade.slug}`);
      }
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

  const handleSairDaComunidade = async (comunidadeId: number) => {
    if (!token) return;
    const confirmou = window.confirm("Deseja sair desta comunidade?");
    if (!confirmou) return;

    const resp = await fetch(`${API_BASE}/comunidade/${comunidadeId}/sair`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await resp.json();
    if (!resp.ok) {
      alert(data.error || "Não foi possível sair da comunidade.");
      return;
    }
    await fetchComunidades();
    alert("Você saiu da comunidade.");
  };

  const minhasComunidades = comunidades.filter(
    (c) => statusUsuario[c.id_comunidade] === "aceito"
  );
  const outrasComunidades = comunidades.filter(
    (c) => statusUsuario[c.id_comunidade] !== "aceito"
  );

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
      <div>
        <h1 className={styles.titleCom}>Minhas Comunidades</h1>
      </div>
      <div className={styles.listaComunidade}>
        {minhasComunidades.length === 0 && <p>Você ainda não participa de nenhuma comunidade.</p>}
        {minhasComunidades.map((comunidade) => {
          return (
            <div key={comunidade.id_comunidade} className={styles.comunidadeCard}>
              <h2>{comunidade.nome}</h2>
              <p>{comunidade.descricao}</p>
              <button onClick={() => handleEntrar(comunidade.id_comunidade, comunidade.tipo)}>
                Acessar
              </button>
              <button
                className={styles.sairComunidadeBtn}
                onClick={() => handleSairDaComunidade(comunidade.id_comunidade)}
              >
                Sair da comunidade
              </button>
            </div>
          );
        })}
      </div>

      <div>
        <h1 className={styles.titleCom}>Outras Comunidades</h1>
      </div>

      <div className={styles.listaComunidade}>
        {outrasComunidades.map((comunidade) => {
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
