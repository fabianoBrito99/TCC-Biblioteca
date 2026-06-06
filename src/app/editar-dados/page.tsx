"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/componentes/forms/button";
import Input from "@/componentes/forms/input";
import AcessoNegado from "@/componentes/acesso-negado/AcessoNegado";
import styles from "./editar-dados.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "https://api.helenaramazzotte.online";

interface User {
  id_usuario: string;
  foto_usuario: string | null;
  nome_login: string;
  email: string;
  telefone: string;
  data_nascimento: string;
  igreja_local: string;
  tipo_usuario: string;
}

interface Endereco {
  cep: string;
  rua: string;
  numero: number | string;
  bairro: string;
  cidade: string;
  estado: string;
}

interface ApiResponse {
  usuario: User;
  endereco: Endereco | null;
}

export default function EditarDadosPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [userIdReady, setUserIdReady] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);
  const [endereco, setEndereco] = useState<Endereco | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [forbidden, setForbidden] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    nome_login: "",
    email: "",
    telefone: "",
    data_nascimento: "",
    igreja_local: "",
    cep: "",
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
  });

  useEffect(() => {
    setUserId(localStorage.getItem("userId"));
    setUserIdReady(true);
  }, []);

  useEffect(() => {
    if (!userIdReady) {
      return;
    }

    if (!userId) {
      setForbidden(true);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setForbidden(false);
    setLoading(true);

    const fetchUserData = async (retryCount = 0): Promise<void> => {
      const maxRetries = 3;
      const retryDelay = 1000 * (retryCount + 1);

      try {
        const token = localStorage.getItem("token");
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const res = await fetch(`${API_BASE}/api/usuario/${userId}`, {
          cache: "no-store",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.status === 401 || res.status === 403) {
          if (isMounted) setForbidden(true);
          return;
        }

        if (!res.ok && retryCount < maxRetries) {
          console.warn(`[Retry ${retryCount + 1}/${maxRetries}] Tentando novamente em ${retryDelay}ms...`);
          setTimeout(() => fetchUserData(retryCount + 1), retryDelay);
          return;
        }

        if (!res.ok) {
          throw new Error("Falha ao buscar usuário");
        }

        const data: ApiResponse = (await res.json()) as ApiResponse;
        if (!isMounted) return;

        setUser(data.usuario);
        setEndereco(data.endereco);

        // Formatar data para input type="date"
        const dataNasc = new Date(data.usuario.data_nascimento);
        const dateString = dataNasc.toISOString().split('T')[0];

        setFormData({
          nome_login: data.usuario.nome_login || "",
          email: data.usuario.email || "",
          telefone: data.usuario.telefone || "",
          data_nascimento: dateString || "",
          igreja_local: data.usuario.igreja_local || "",
          cep: data.endereco?.cep || "",
          rua: data.endereco?.rua || "",
          numero: String(data.endereco?.numero || ""),
          bairro: data.endereco?.bairro || "",
          cidade: data.endereco?.cidade || "",
          estado: data.endereco?.estado || "",
        });
      } catch (err: unknown) {
        if (!isMounted) return;

        const errorMsg = err instanceof Error ? err.message : String(err);

        if (
          errorMsg.includes("ERR_CERT") ||
          errorMsg.includes("Failed to fetch") ||
          errorMsg.includes("AbortError")
        ) {
          if (retryCount < maxRetries) {
            console.warn(`[Erro de conexão] Tentando novamente (${retryCount + 1}/${maxRetries})...`);
            setTimeout(() => fetchUserData(retryCount + 1), retryDelay);
          } else {
            console.error("Erro ao buscar usuário após múltiplas tentativas:", errorMsg);
            setForbidden(true);
          }
        } else {
          console.error("Erro ao buscar dados:", err);
          setForbidden(true);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void fetchUserData();
    return () => {
      isMounted = false;
    };
  }, [userId, userIdReady]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem("token");
      
      // Atualizar usuário
      const userRes = await fetch(`${API_BASE}/api/usuario/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          nome_login: formData.nome_login,
          email: formData.email,
          telefone: formData.telefone,
          data_nascimento: formData.data_nascimento,
          igreja_local: formData.igreja_local,
        }),
      });

      if (!userRes.ok) {
        throw new Error("Falha ao atualizar usuário");
      }

      // Atualizar endereço
      const enderecoRes = await fetch(`${API_BASE}/api/endereco/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify({
          cep: formData.cep,
          rua: formData.rua,
          numero: parseInt(formData.numero, 10) || 0,
          bairro: formData.bairro,
          cidade: formData.cidade,
          estado: formData.estado,
        }),
      });

      if (!enderecoRes.ok) {
        throw new Error("Falha ao atualizar endereço");
      }

      setSuccess("Dados atualizados com sucesso!");
      setTimeout(() => {
        router.push("/conta");
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar dados");
      console.error("Erro ao salvar:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className={styles.container}>Carregando dados...</div>;
  if (forbidden) return <AcessoNegado />;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Editar Dados Pessoais</h1>
        <button 
          onClick={() => router.back()}
          className={styles.backButton}
        >
          ← Voltar
        </button>
      </div>

      <form onSubmit={handleSave} className={styles.form}>
        <div className={styles.section}>
          <h2>Informações Pessoais</h2>
          
          <Input
            label="Nome"
            name="nome_login"
            type="text"
            value={formData.nome_login}
            onChange={handleInputChange}
          />

          <Input
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
          />

          <Input
            label="Telefone"
            name="telefone"
            type="tel"
            value={formData.telefone}
            onChange={handleInputChange}
          />

          <Input
            label="Data de Nascimento"
            name="data_nascimento"
            type="date"
            value={formData.data_nascimento}
            onChange={handleInputChange}
          />

          <Input
            label="Igreja Local"
            name="igreja_local"
            type="text"
            value={formData.igreja_local}
            onChange={handleInputChange}
          />
        </div>

        <div className={styles.section}>
          <h2>Endereço</h2>
          
          <Input
            label="CEP"
            name="cep"
            type="text"
            value={formData.cep}
            onChange={handleInputChange}
          />

          <Input
            label="Rua"
            name="rua"
            type="text"
            value={formData.rua}
            onChange={handleInputChange}
          />

          <Input
            label="Número"
            name="numero"
            type="text"
            value={formData.numero}
            onChange={handleInputChange}
          />

          <Input
            label="Bairro"
            name="bairro"
            type="text"
            value={formData.bairro}
            onChange={handleInputChange}
          />

          <Input
            label="Cidade"
            name="cidade"
            type="text"
            value={formData.cidade}
            onChange={handleInputChange}
          />

          <Input
            label="Estado"
            name="estado"
            type="text"
            value={formData.estado}
            onChange={handleInputChange}
          />
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}

        <div className={styles.buttons}>
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Salvar Alterações"}
          </Button>
          <button 
            type="button" 
            onClick={() => router.back()}
            className={styles.cancelButton}
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
