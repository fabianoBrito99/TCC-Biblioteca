// LoginCriarForm.tsx
import React, { useState } from "react";
import { useFormStatus } from "react-dom";
import Button from "@/componentes/forms/button";
import Input from "@/componentes/forms/input";
import styles from "./login-form.module.css";

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

  // Estado para os campos da aba "Usuário"
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [telefone, setTelefone] = useState("");

  // Estado para os campos da aba "Endereço"
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [bairro, setBairro] = useState("");
  const [numero, setNumero] = useState("");
  const [igrejaLocal, setIgrejaLocal] = useState(false); // Checkbox

  const handleCepBlur = () => {
    const cleanedCep = cep.replace(/\D/g, "");
    if (cleanedCep.length === 8) {
      fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`)
        .then(response => response.json())
        .then(data => {
          if (!data.erro) {
            setRua(data.logradouro);
            setBairro(data.bairro);
          } else {
            alert("CEP não encontrado.");
          }
        })
        .catch(error => console.error("Erro ao buscar o CEP:", error));
    } else {
      alert("CEP inválido.");
    }
  };

  return (
    <div>
      <h1 className={styles.h1Login}>Informe os dados</h1>

      {/* Navegação por abas */}
      <div className={styles.tabNavigation}>
        <button
          className={`${styles.tabButton} ${activeTab === "usuario" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("usuario")}
        >
          Usuário
        </button>
        <button
          className={`${styles.tabButton} ${activeTab === "endereco" ? styles.activeTab : ""}`}
          onClick={() => setActiveTab("endereco")}
        >
          Endereço
        </button>
      </div>

      <form className={styles.form}>
        {activeTab === "usuario" ? (
          <>
            <Input
              label="Usuário"
              name="username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
            <Input
              label="Email"
              name="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
            <Input
              label="Senha"
              name="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            <Input
              label="Confirma a Senha"
              name="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
            <Input
              label="Telefone"
              name="telefone"
              type="phone"
              value={telefone}
              onChange={e => setTelefone(e.target.value)}
            />
          </>
        ) : (
          <>
            <Input
              label="CEP"
              name="cep"
              type="text"
              value={cep}
              onChange={e => setCep(e.target.value)}
              onBlur={handleCepBlur}
            />
            <Input
              label="Rua"
              name="rua"
              type="text"
              value={rua}
              readOnly
            />
            <Input
              label="Bairro"
              name="bairro"
              type="text"
              value={bairro}
              readOnly
            />
            <Input
              label="Número"
              name="numero"
              type="text"
              value={numero}
              onChange={e => setNumero(e.target.value)}
            />
            <label className={styles.checkboxLabel}>
              <input
                className={styles.checkbox}
                type="checkbox"
                name="igrejaLocal"
                checked={igrejaLocal}
                onChange={e => setIgrejaLocal(e.target.checked)}
              />
              É membro da IMUB?
            </label>
          </>
        )}
        <FormButton />
      </form>

      <h2 className={styles.subtitle}>Faça Login</h2>
      <p className={styles.conta}>Já possui conta? Faça Login.</p>
      <button className={styles.button2} onClick={onToggle}>
        Login
      </button>
    </div>
  );
}
