"use client";
import React, { useEffect, useState } from "react";
import { useFormStatus } from "react-dom";
import Button from "@/componentes/forms/button";
import Input from "@/componentes/forms/input";
import styles from "./login-form.module.css";
import Image from "next/image";

function FormButton() {
  const { pending } = useFormStatus();
  return (
    <>
      {pending ? (
        <Button disabled>Cadastrando...</Button>
      ) : (
        <Button>Cadastrar</Button>
      )}
    </>
  );
}

type LoginCriarFormProps = {
  onToggle: () => void;
};

export default function LoginCriarForm({ onToggle }: LoginCriarFormProps) {
  const [activeTab, setActiveTab] = useState("usuario");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [telefone, setTelefone] = useState("");
  const [sexo, setSexo] = useState("");
  const [data_nascimento, setDataNascimento] = useState("");
  const [fotoPerfil, setFotoPerfil] = useState<File | null>(null);
  const [capaPreview, setCapaPreview] = useState<string | null>(null);
  const [fotoBase64, setFotoBase64] = useState<string | null>(null); 
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [bairro, setBairro] = useState("");
  const [numero, setNumero] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [igrejaLocal, setIgrejaLocal] = useState(false);

  useEffect(() => {
    if (fotoPerfil) {
      const reader = new FileReader();
      reader.onloadend = () => setFotoBase64(reader.result as string);
      reader.readAsDataURL(fotoPerfil);
    }
  }, [fotoPerfil]);

  useEffect(() => {
    if (fotoPerfil) {
      const objectUrl = URL.createObjectURL(fotoPerfil);
      setCapaPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setCapaPreview(null);
  }, [fotoPerfil]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setFotoPerfil(file);
  };

  const handleCepBlur = () => {
    const cleanedCep = cep.replace(/\D/g, "");
    if (cleanedCep.length === 8) {
      fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`)
        .then((response) => response.json())
        .then((data) => {
          if (!data.erro) {
            setRua(data.logradouro);
            setBairro(data.bairro);
            setCidade(data.localidade);
            setEstado(data.uf);
          } else {
            alert("CEP não encontrado.");
          }
        })
        .catch((error) => console.error("Erro ao buscar o CEP:", error));
    } else {
      alert("CEP inválido.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert("As senhas não coincidem.");
      return;
    }

    if (!fotoBase64) {
      alert("Por favor, selecione uma foto de perfil.");
      return;
    }

    // Envio dos dados para o backend
    fetch("http://localhost:4000/api/usuario", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nome_login: username,
        email,
        senha: password,
        telefone,
        data_nascimento,
        foto_usuario: fotoBase64, 
        igreja_local: igrejaLocal,
        sexo,
        cep,
        rua,
        numero,
        bairro,
        cidade,
        estado,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.erro) {
          alert(data.erro);
        } else {
          alert("Usuário cadastrado com sucesso!");
        }
      })
      .catch((error) => console.error("Erro ao cadastrar usuário:", error));
  };

  return (
    <div className={styles.tabNavigationFixo}>
      <h1 className={styles.h1Login}>Informe os dados</h1>
      <div className={styles.tabNavigation}>
        <button
          className={`${styles.tabButton} ${
            activeTab === "usuario" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("usuario")}
        >
          Usuário
        </button>
        <button
          className={`${styles.tabButton} ${
            activeTab === "endereco" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("endereco")}
        >
          Endereço
        </button>
      </div>

      <div className={styles.formFixo}>
        <form className={styles.form} onSubmit={handleSubmit}>
          {activeTab === "usuario" ? (
            <>
              <Input
                label="Usuário"
                name="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <Input
                label="Email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                label="Senha"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Input
                label="Confirma a Senha"
                name="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <Input
                label="Telefone"
                name="telefone"
                type="phone"
                value={telefone}
                onChange={(e) => setTelefone(e.target.value)}
              />
              <div className={styles.sexo}>
                <label htmlFor="sexo">Sexo</label>
                <select
                  id="sexo"
                  name="sexo"
                  value={sexo}
                  onChange={(e) => setSexo(e.target.value)}
                >
                  <option value="">Selecione</option>
                  <option value="Masculino">Masculino</option>
                  <option value="Feminino">Feminino</option>
                </select>
              </div>

              <div className={styles.igrejaLocal}>
                <label>
                  <input
                    type="checkbox"
                    checked={igrejaLocal}
                    onChange={() => setIgrejaLocal(!igrejaLocal)}
                  />
                  Membro IMUB?
                </label>
              </div>
            </>
          ) : (
            <>
              <div className={styles.cep}>
                <Input
                  label="CEP"
                  name="cep"
                  type="text"
                  value={cep}
                  onChange={(e) => setCep(e.target.value)}
                  onBlur={handleCepBlur}
                />
              </div>
              <div className={styles.rua}>
                <Input
                  label="Rua"
                  name="rua"
                  type="text"
                  value={rua}
                  onChange={(e) => setRua(e.target.value)}
                />
              </div>
              <div className={styles.bairro}>
                <Input
                  label="Bairro"
                  name="bairro"
                  type="text"
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                />
              </div>
              <div className={styles.num}>
                <Input
                  label="Número"
                  name="numero"
                  type="text"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                />
              </div>
              <div className={styles.cidade}>
                <Input
                  label="Cidade"
                  name="cidade"
                  type="text"
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                />
              </div>
              <div className={styles.estado_data}>
                <div className={styles.estado}>
                  <Input
                    label="Estado"
                    name="estado"
                    type="text"
                    value={estado}
                    onChange={(e) => setEstado(e.target.value)}
                  />
                </div>
                <div className={styles.dataNasc}>
                  <Input
                    label="Data Nascimento"
                    name="data_nascimento"
                    type="date"
                    value={data_nascimento}
                    onChange={(e) => setDataNascimento(e.target.value)}
                  />
                </div>
              </div>
              <div className={styles.foto}>
                <Input
                  label="Foto Perfil"
                  name="fotoPerfil"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                {capaPreview && (
                  <div className={styles.capaContainerLivro}>
                    <Image
                      src={capaPreview}
                      alt="Preview foto de perfil"
                      className={styles.capaPreview}
                      width={1000}
                      height={1000}
                    />
                  </div>
                )}
              </div>
            </>
          )}
          <div className={styles.btCad}>
            <FormButton />
          </div>
        </form>
      </div>
      <div className={styles.ptBaixo}>
        <h2 className={styles.subtitle}>Faça Login</h2>
        <p className={styles.conta}>Já possui conta? Faça Login.</p>
        <button className={styles.button2} onClick={onToggle}>
          Login
        </button>
      </div>
    </div>
  );
}
