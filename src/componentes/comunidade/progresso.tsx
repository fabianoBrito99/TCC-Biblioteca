"use client";
import React, { useState } from "react";
import styles from "./progesso.module.css";
import { FaCheck } from "react-icons/fa";
import Input from "../forms/input";

interface ProgressoFormProps {
  comunidadeId: number;
  onProgressoAdicionado: () => void; // Função de callback para atualizar o progresso
}

export default function ProgressoForm({
  comunidadeId,
  onProgressoAdicionado,
}: ProgressoFormProps) {
  const [paginasLidas, setPaginasLidas] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Recupera o ID do usuário do localStorage
    const usuarioId = localStorage.getItem("userId");

    if (!usuarioId) {
      console.error("Usuário não encontrado no localStorage.");
      return; // Impede o envio sem o ID do usuário
    }

    try {
      const response = await fetch(
        `/api/comunidade/${comunidadeId}/progresso`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fk_id_usuario: parseInt(usuarioId), // Enviando o ID como número
            paginas_lidas: parseInt(paginasLidas),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao enviar progresso");
      }

      setPaginasLidas(""); // Limpa o campo após o envio
      if (typeof onProgressoAdicionado === "function") {
        onProgressoAdicionado(); // Notifica o componente pai
      }
    } catch (error) {
      console.error("Erro ao adicionar progresso:", error);
    }
  };

  return (
    <form className={styles.progessoFixo} onSubmit={handleSubmit}>
      <h4>Adicione o progresso do dia:</h4>
      <Input
        label="Páginas lidas:"
        type="number"
        value={paginasLidas}
        onChange={(e) => setPaginasLidas(e.target.value)}
        required
      />
      <button type="submit">
        <FaCheck size={20} color="#fdf8e2" />
      </button>
    </form>
  );
}
