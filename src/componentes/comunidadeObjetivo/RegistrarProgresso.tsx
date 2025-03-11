import React, { useState } from "react";
import styles from "./objetivo.module.css";

interface RegistrarProgressoProps {
  idObjetivo: number;
  userId: number;
  atualizarProgresso: () => void;
}

const RegistrarProgresso: React.FC<RegistrarProgressoProps> = ({ idObjetivo, userId, atualizarProgresso }) => {
  const [paginasLidas, setPaginasLidas] = useState<number>(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
  
    if (!idObjetivo || isNaN(idObjetivo)) {
      alert("Erro: ID do objetivo inválido!");
      return;
    }
  
    await fetch("http://localhost:4000/api/comunidade/objetivo/progresso", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fk_id_objetivo: Number(idObjetivo), // Garante que seja número
        fk_id_usuario: userId,
        paginas_lidas: paginasLidas,
      }),
    });
  
    setPaginasLidas(0);
    atualizarProgresso();
  };
  

  return (
    <form className={styles["modal"]} onSubmit={handleSubmit}>
      <input type="number" placeholder="Páginas lidas" value={paginasLidas} onChange={(e) => setPaginasLidas(Number(e.target.value))} required />
      <button type="submit">Atualizar Progresso</button>
    </form>
  );
};

export default RegistrarProgresso;
