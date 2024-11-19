"use client";
import React, { useState } from "react";
import styles from "./progesso.module.css";

interface ProgressoFormProps {
  comunidadeId: number;
}

export default function ProgressoForm({ comunidadeId }: ProgressoFormProps) {
  const [paginasLidas, setPaginasLidas] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Recupera o ID do usuário do localStorage
    const usuarioId = localStorage.getItem("userId");

    if (!usuarioId) {
      console.error("Usuário não encontrado no localStorage.");
      return; // Impede o envio sem o ID do usuário
    }

    await fetch(`http://localhost:4000/api/comunidade/${comunidadeId}/progresso`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fk_id_usuario: parseInt(usuarioId), // Certifique-se de enviar como número
        paginas_lidas: parseInt(paginasLidas),
      }),
    });

    setPaginasLidas(""); // Limpa o campo após o envio
  };

  return (
    
    <form className={styles.progessoFixo} onSubmit={handleSubmit}>
      <label>
        Páginas lidas:
        <input
          type="number"
          value={paginasLidas}
          onChange={(e) => setPaginasLidas(e.target.value)}
          required
        />
      </label>
      <button type="submit">Adicionar Progresso</button>
    </form>
  );
}
