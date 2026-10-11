"use client";

import React, { useEffect, useState } from "react";
import HistoricoUsuario from "@/componentes/historico/historico-usuario";
import styles from "./usuarioDetalhes.module.css";
import Image from "next/image";
import AcessoNegado from "@/componentes/acesso-negado/AcessoNegado";


interface Usuario {
  id_usuario: number;
  nome_login: string;
  email: string;
  tipo_usuario: string;
  foto_usuario: string;
}

export default function UsuarioDetalhes({
  params,
}: {
  params: { id: string };
}) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [forbidden, setForbidden] = useState<boolean>(false);
  const [editando, setEditando] = useState<boolean>(false);
  const [novoTipoUsuario, setNovoTipoUsuario] = useState<string>("");
  const [salvandoTipo, setSalvandoTipo] = useState(false);
  const [mensagemTipo, setMensagemTipo] = useState<{
    tipo: "sucesso" | "erro";
    texto: string;
  } | null>(null);

  useEffect(() => {
    const fetchUsuario = async () => {
      try {
        const response = await fetch(
          `/api/a6b7e9c4f/usuario/${params.id}`
        );
        if (response.status === 401 || response.status === 403) {
          setForbidden(true);
          return;
        }
        if (!response.ok) {
          throw new Error("Erro ao buscar usuário");
        }
        const data = await response.json();
        setUsuario(data.usuario);
      } catch {
        setError("Erro ao buscar dados do usuário");
      } finally {
        setLoading(false);
      }
    };

    fetchUsuario();
  }, [params.id]);

  const handleSalvar = async () => {
    if (!usuario) return;

    const tipoSelecionado = novoTipoUsuario || usuario.tipo_usuario;
    setSalvandoTipo(true);
    setMensagemTipo(null);

    try {
      const response = await fetch(
        `/api/a6b7e9c4f/usuario/${usuario.id_usuario}/tipo`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ tipo_usuario: tipoSelecionado }),
        }
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          typeof data.erro === "string"
            ? data.erro
            : "Não foi possível atualizar o tipo de usuário."
        );
      }

      const tipoAtualizado = data.usuario?.tipo_usuario || tipoSelecionado;
      setUsuario({ ...usuario, tipo_usuario: tipoAtualizado });
      setNovoTipoUsuario(tipoAtualizado);
      setEditando(false);
      setMensagemTipo({
        tipo: "sucesso",
        texto: "Tipo de usuário atualizado com sucesso.",
      });
    } catch (error) {
      setMensagemTipo({
        tipo: "erro",
        texto:
          error instanceof Error
            ? error.message
            : "Não foi possível atualizar o tipo de usuário.",
      });
    } finally {
      setSalvandoTipo(false);
    }
  };

  if (loading) return <div>Carregando dados do usuário...</div>;
  if (forbidden) return <AcessoNegado />;
  if (error) return <div>{error}</div>;

  return (
    <div className={styles.container}>
      {usuario && (
        <>
          <div className={styles.usuarioDetalhes}>
            <Image
              src={`data:image/png;base64,${usuario.foto_usuario}`}
              alt={usuario.nome_login}
              className={styles.usuarioFoto}
              width={1000}
              height={1000}
            />
            <div className={styles.usuarioInfo}>
              <h2>{usuario.nome_login}</h2>
              <p> <strong> Email:</strong> {usuario.email}</p>
              <p>
                <strong> Tipo de Usuário:</strong>{" "}
                {editando ? (
                  <div className={styles.editContainer}>
                    <select
                      value={novoTipoUsuario || usuario.tipo_usuario}
                      onChange={(e) => {
                        setNovoTipoUsuario(e.target.value);
                        setMensagemTipo(null);
                      }}
                      className={styles.tipoSelect}
                    >
                      <option value="leitor">Leitor</option>
                      <option value="leitor+mykids">Leitor + MyKids</option>
                      <option value="voluntario">Voluntário</option>
                      <option value="admin">Administrador</option>
                    </select>
                    <button
                      className={styles.salvarBtn}
                      onClick={handleSalvar}
                      disabled={salvandoTipo}
                    >
                      {salvandoTipo ? "Salvando..." : "Salvar"}
                    </button>
                  </div>
                ) : (
                  <>
                    {usuario.tipo_usuario}{" "}
                    <button
                      className={styles.editarBtn}
                      onClick={() => {
                        setEditando(true);
                        setNovoTipoUsuario(usuario.tipo_usuario);
                        setMensagemTipo(null);
                      }}
                    >
                      ✏️editar
                    </button>
                  </>
                )}
              </p>
              {mensagemTipo && (
                <p
                  className={[
                    styles.statusMessage,
                    mensagemTipo.tipo === "sucesso"
                      ? styles.statusSuccess
                      : styles.statusError,
                  ].join(" ")}
                  role={mensagemTipo.tipo === "erro" ? "alert" : "status"}
                >
                  {mensagemTipo.texto}
                </p>
              )}
            </div>
          </div>
          <h1 className={styles.titleHistorico}>Histórico</h1>
          <div className={styles.containerHistorico}>
            <HistoricoUsuario userId={params.id} />
          </div>
        </>
      )}
    </div>
  );
}
