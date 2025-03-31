import React, { useEffect, useState } from "react";
import styles from "./objetivo.module.css";
import Input from "../forms/input";
import Button from "../forms/button";
import { FaCheck } from "react-icons/fa";

interface RegistrarProgressoProps {
  comunidadeId: number;
  idObjetivo: number;
  userId: number; // continua sendo passado via props
  onProgressoSalvo: (dados: { paginas: number; nome: string }) => void;
}

const RegistrarProgresso: React.FC<RegistrarProgressoProps> = ({
  comunidadeId,
  idObjetivo,
  userId,
  onProgressoSalvo,
}) => {
  const [paginasLidas, setPaginasLidas] = useState<number>(0);
  const [nomeUsuario, setNomeUsuario] = useState<string>("");

  // ✅ Carrega nome do usuário via API com base no localStorage
  useEffect(() => {
    const fetchNomeUsuario = async () => {
      const id = localStorage.getItem("userId");
      if (!id) return;

      try {
        const res = await fetch(`http://localhost:4000/api/usuario/${id}`);
        if (res.ok) {
          const data = await res.json();
          setNomeUsuario(data.usuario.nome_login); // 👈 aqui pega o nome corretamente
        } else {
          console.warn("⚠️ Falha ao buscar nome do usuário.");
        }
      } catch (err) {
        console.error("❌ Erro ao buscar nome do usuário:", err);
      }
    };

    fetchNomeUsuario();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!idObjetivo || isNaN(idObjetivo)) {
      alert("Erro: ID do objetivo inválido!");
      return;
    }

    const dados = {
      fk_id_objetivo: idObjetivo,
      fk_id_usuario: userId,
      paginas_lidas: paginasLidas,
      nome_login: nomeUsuario,
    };

    console.log("📨 Enviando progresso:", dados);

    const response = await fetch(
      `http://localhost:4000/api/comunidade/${comunidadeId}/objetivo/progresso`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
      }
    );

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Progresso salvo! Páginas:", data.paginas_inseridas);
      setPaginasLidas(0);

      onProgressoSalvo({
        paginas: data.paginas_inseridas,
        nome: nomeUsuario,
      });
    } else {
      const errorText = await response.text();
      alert("Erro ao registrar progresso: " + errorText);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className={styles["modal2"]}>
        <Input
          label="Páginas Lidas"
          type="number"
          value={paginasLidas}
          onChange={(e) => setPaginasLidas(Number(e.target.value))}
          required
        />

        <Button type="submit">
          <FaCheck size={20} color="#fdf8e2" />
        </Button>
      </div>
    </form>
  );
};

export default RegistrarProgresso;
