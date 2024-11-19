"use client";
import React, { useState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import Button from "@/componentes/forms/button";
import Input from "@/componentes/forms/input";
import styles from "./cadastrarLivro.module.css";

function FormButton() {
  const { pending } = useFormStatus();
  return (
    <>
      {pending ? (
        <Button disabled>Salvando...</Button>
      ) : (
        <Button>Salvar</Button>
      )}
    </>
  );
}

type CadastrarLivroProps = {
  onToggle: () => void;
};

export default function CadastrarLivro({ onToggle }: CadastrarLivroProps) {
  const [activeTab, setActiveTab] = useState("Dados do Livro");

  // Estados para os campos
  const [nomeLivro, setNomeLivro] = useState("");
  const [descricao, setDescricao] = useState("");
  const [isbn, setIsbn] = useState("");
  const [anoPublicacao, setAnoPublicacao] = useState("");
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [bairro, setBairro] = useState("");
  const [numero, setNumero] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");

  // Estados para autores, editoras e categorias
  const [autor, setAutor] = useState("");
  const [editora, setEditora] = useState("");
  const [autores, setAutores] = useState<string[]>([]);
  const [categorias, setCategorias] = useState<string[]>([]);

  //foto de capa
  const [capaLivro, setCapaLivro] = useState<File | null>(null);
  const [capaPreview, setCapaPreview] = useState<string | null>(null);

  // Estados para sugestões
  const [filteredCategorias, setFilteredCategorias] = useState<string[]>([]);
  const [filteredEditoras, setFilteredEditoras] = useState<string[]>([]);
  const [filteredAutores, setFilteredAutores] = useState<string[]>([]);

  const [categoria, setCategoria] = useState("");
  const [showCategoriaSuggestions, setShowCategoriaSuggestions] =
    useState(false);
  const [showAutorSuggestions, setShowAutorSuggestions] = useState(false);
  const [showEditoraSuggestions, setShowEditoraSuggestions] = useState(false);

  useEffect(() => {
    fetch("http://127.0.0.1:4000/categorias")
      .then((response) => response.json())
      .then((data) => {
        setCategorias(data.categorias || []);
        setFilteredCategorias(data.categorias || []); // Inicializa as categorias filtradas
      })
      .catch((error) => console.error("Erro ao carregar categorias:", error));

    fetch("http://127.0.0.1:4000/autores")
      .then((response) => response.json())
      .then((data) => {
        setAutores(data.autores || []);
        setFilteredAutores(data.autores || []); // Inicializa os autores filtrados
      })
      .catch((error) => console.error("Erro ao carregar autores:", error));

    fetch("http://127.0.0.1:4000/editoras")
      .then((response) => response.json())
      .then((data) => {
        setFilteredEditoras(data.editoras || []); // Inicializa as editoras filtradas
      })
      .catch((error) => console.error("Erro ao carregar editoras:", error));
  }, []);

    // Efeito para gerar a pré-visualização da imagem
    useEffect(() => {
      if (capaLivro) {
        const objectUrl = URL.createObjectURL(capaLivro);
        setCapaPreview(objectUrl);
        // Limpeza da URL do objeto ao desmontar
        return () => URL.revokeObjectURL(objectUrl);
      }
      setCapaPreview(null);
    }, [capaLivro]);

  // Mudança de categoria com botão de seta para mostrar todas as categorias
  const handleCategoryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCategoria(value);
    setShowCategoriaSuggestions(true); // Mostrar sugestões ao começar a digitar

    // Filtra as categorias com base na entrada do usuário
    const filtered = categorias.filter((cat) =>
      cat.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredCategorias(filtered); // Atualiza apenas com as categorias filtradas
  };

  // Função para selecionar a categoria da lista de sugestões
  const selectCategory = (category: string) => {
    setCategoria(category);
    setShowCategoriaSuggestions(false); // Esconde as sugestões após a seleção
  };

  const toggleCategorySuggestions = () => {
    setShowCategoriaSuggestions(!showCategoriaSuggestions); // Alterna a visibilidade das sugestões
    if (!showCategoriaSuggestions) setFilteredCategorias(categorias); // Exibe todas as categorias ao abrir
  };

  const handleAutorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAutor(value);
    setShowAutorSuggestions(value.length > 0); // Mostrar sugestões somente se houver entrada

    // Filtra os autores com base na entrada do usuário
    const filtered = autores.filter((aut) =>
      aut.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredAutores(filtered);
  };

  const handleEditoraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEditora(value); // Corrigido para permitir que o campo de editora receba texto

    // Filtra as editoras com base na entrada do usuário
    const filtered = filteredEditoras.filter((edit) =>
      edit.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredEditoras(filtered);
    setShowEditoraSuggestions(value.length > 0);
  };

  const handleBlur = (type: string) => {
    if (type === "categoria") {
      setShowCategoriaSuggestions(false);
    } else if (type === "autor") {
      setShowAutorSuggestions(false);
    } else if (type === "editora") {
      setShowEditoraSuggestions(false);
    }
  };

  // Fetch para CEP
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

  return (
    <div className={styles.containerCadastrar}>
      <h1 className={styles.titleCadastrar}>Cadastrar Livro</h1>

      {/* Navegação por abas */}
      <div className={styles.tabNavigation}>
        <button
          className={`${styles.tabButton} ${
            activeTab === "Dados do Livro" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("Dados do Livro")}
        >
          Dados do Livro
        </button>
        <button
          className={`${styles.tabButton} ${
            activeTab === "Editora" ? styles.activeTab : ""
          }`}
          onClick={() => setActiveTab("Editora")}
        >
          Editora
        </button>
      </div>

      <form className={styles.form}>
        {activeTab === "Dados do Livro" ? (
          <>
            <Input
              label="Nome do Livro"
              name="nomeLivro"
              type="text"
              value={nomeLivro}
              onChange={(e) => setNomeLivro(e.target.value)}
            />
            <Input
              label="Descrição"
              name="descricao"
              type="text"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
            />

            <Input
              label="Ano de Publicação"
              name="anoPublicacao"
              type="number"
              value={anoPublicacao}
              onChange={(e) => setAnoPublicacao(e.target.value)}
            />
            <div className={styles.categoryInputContainer}>
              <Input
                label="Categoria"
                name="categoria"
                type="text"
                value={categoria}
                onChange={handleCategoryChange}
                onBlur={() => handleBlur("categoria")}
              />
              <button
                type="button"
                onClick={toggleCategorySuggestions}
                className={styles.dropdownButton}
              >
                ▼
              </button>
              {showCategoriaSuggestions && filteredCategorias.length > 0 && (
                <ul className={styles.suggestionList}>
                  {filteredCategorias.map((cat, index) => (
                    <li
                      key={index}
                      className={styles.suggestionItem}
                      onClick={() => selectCategory(cat)} // Seleciona a categoria ao clicar
                    >
                      {cat}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className={styles.categoryInputContainer}>
              <Input
                label="Autor"
                name="autor"
                type="text"
                value={autor}
                onChange={handleAutorChange}
                onBlur={() => handleBlur("autor")}
              />
              {showAutorSuggestions && filteredAutores.length > 0 && (
                <ul className={styles.suggestionList}>
                  {filteredAutores.map((aut, index) => (
                    <li key={index} className={styles.suggestionItem}>
                      {aut}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* Input para a foto de capa */}
            <Input
              label="Foto de Capa do Livro"
              name="capaLivro"
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0] || null;
                setCapaLivro(file);
              }}
            />
            {/* Renderização da pré-visualização da imagem */}
            {capaPreview && (
              <div className={styles.capaPreviewContainer}>
                <img src={capaPreview} alt="Pré-visualização da capa" className={styles.capaPreviewImage} />
              </div>
            )}
          </>
        ) : (
          <>
            <Input
              label="Editora"
              name="editora"
              type="text"
              value={editora}
              onChange={handleEditoraChange}
              onBlur={() => handleBlur("editora")}
            />
            {showEditoraSuggestions && filteredEditoras.length > 0 && (
              <ul className={styles.suggestionList}>
                {filteredEditoras.map((edit, index) => (
                  <li key={index} className={styles.suggestionItem}>
                    {edit}
                  </li>
                ))}
              </ul>
            )}
            <Input
              label="CEP"
              name="cep"
              type="text"
              value={cep}
              onChange={(e) => setCep(e.target.value)}
              onBlur={handleCepBlur}
            />
            <Input
              label="Rua"
              name="rua"
              type="text"
              value={rua}
              onChange={(e) => setRua(e.target.value)}
            />
            <Input
              label="Bairro"
              name="bairro"
              type="text"
              value={bairro}
              onChange={(e) => setBairro(e.target.value)}
            />
            <Input
              label="Número"
              name="numero"
              type="text"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
            />
            <Input
              label="Cidade"
              name="cidade"
              type="text"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
            />
            <Input
              label="Estado"
              name="estado"
              type="text"
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
            />
          </>
        )}
        <FormButton />
      </form>
    </div>
  );
}
