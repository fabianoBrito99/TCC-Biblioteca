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

type Categoria = {
  categoria_principal: string;
  cor_cima: string;
  cor_baixo: string;
};
type Editora = {
  nome_editora: string;
  cep: string;
  rua: string;
  bairro: string;
  numero: string;
  cidade: string;
  estado: string;
};

type CadastrarLivroProps = {
  onToggle?: () => void;
};

export default function CadastrarLivro({ onToggle }: CadastrarLivroProps) {
  const [activeTab, setActiveTab] = useState("Dados do Livro");

  // Estados para os campos
  const [nomeLivro, setNomeLivro] = useState("");
  const [descricao, setDescricao] = useState("");
  const [anoPublicacao, setAnoPublicacao] = useState("");
  const [quantidade_paginas, setQuantidadePaginas] = useState("");
  const [quantidade_estoque, setQuantidadeEstoque] = useState("");
  const [categoria, setCategoria] = useState("");
  const [subcategorias, setSubcategorias] = useState<string[]>([""]);

  const [corCima, setCorCima] = useState("#000000");
  const [corBaixo, setCorBaixo] = useState("#FFFFFF");

  const [editora, setEditora] = useState("");
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [bairro, setBairro] = useState("");
  const [numero, setNumero] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [capaLivro, setCapaLivro] = useState<File | null>(null);
  const [capaPreview, setCapaPreview] = useState<string | null>(null);

  const [categoriaSugestoes, setCategoriaSugestoes] = useState<Categoria[]>([]);

  const [editoraSugestoes, setEditoraSugestoes] = useState<Editora[]>([]);
  const [showCategoriaSugestoes, setShowCategoriaSugestoes] = useState(false);

  const [showEditoraSugestoes, setShowEditoraSugestoes] = useState(false);

  const [autores, setAutores] = useState<string[]>([""]); // Array de autores, inicializado com um campo vazio
  const [autorSugestoes, setAutorSugestoes] = useState<string[]>([]);
  const [showAutorSugestoes, setShowAutorSugestoes] = useState<number | null>(
    null
  ); // Controla qual campo está exibindo sugestões

  useEffect(() => {
    async function fetchSuggestions() {
      try {
        const [categoriaRes, autorRes, editoraRes] = await Promise.all([
          fetch("http://127.0.0.1:4000/api/sugestoes/categorias"),
          fetch("http://127.0.0.1:4000/api/sugestoes/autores"),
          fetch("http://127.0.0.1:4000/api/sugestoes/editoras"),
        ]);

        const categorias: Categoria[] = await categoriaRes.json();
        const editoras: Editora[] = await editoraRes.json();

        setCategoriaSugestoes(categorias);
        setAutorSugestoes(await autorRes.json());
        setEditoraSugestoes(editoras);
      } catch (error) {
        console.error("Erro ao buscar sugestões:", error);
      }
    }
    fetchSuggestions();
  }, []);

  const handleInputChange =
    (
      setter: React.Dispatch<React.SetStateAction<string>>,
      suggestions: string[],
      setSuggestions: React.Dispatch<React.SetStateAction<string[]>>
    ) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setter(value);

      // Filtrar as sugestões, mas sempre exibir se tiver sugestões disponíveis
      const filtered = suggestions.filter((sugestao) =>
        sugestao.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(value ? filtered : suggestions);
    };

  // Efeito para gerar a pré-visualização da imagem
  useEffect(() => {
    if (capaLivro) {
      const objectUrl = URL.createObjectURL(capaLivro);
      setCapaPreview(objectUrl);
      return () => URL.revokeObjectURL(objectUrl);
    }
    setCapaPreview(null);
  }, [capaLivro]);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("nomeLivro", nomeLivro);
    formData.append("descricao", descricao);
    formData.append("anoPublicacao", anoPublicacao);
    formData.append("categoria_principal", categoria);
    formData.append("quantidade_paginas", quantidade_paginas);
    formData.append("quantidade_estoque", quantidade_estoque);
    formData.append("cor_cima", corCima);
    formData.append("cor_baixo", corBaixo);
    formData.append("editora", editora);
    formData.append("cep", cep);
    formData.append("rua", rua);
    formData.append("bairro", bairro);
    formData.append("numero", numero);
    formData.append("cidade", cidade);
    formData.append("estado", estado);

    // Adicionando os autores e subcategorias
    autores.forEach((autor, index) =>
      formData.append(`autores[${index}]`, autor)
    );
    subcategorias.forEach((subcategoria, index) =>
      formData.append(`subcategorias[${index}]`, subcategoria)
    );

    // Adiciona a imagem como BLOB ao formData
    if (capaLivro) {
      formData.append("foto_capa", capaLivro); // foto_capa será enviada como arquivo
      console.log("Imagem adicionada ao formData:", capaLivro);
    }

    try {
      const response = await fetch("http://127.0.0.1:4000/livro", {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert("Livro cadastrado com sucesso!");
        onToggle?.();
        // Limpeza dos campos do formulário
        setNomeLivro("");
        setDescricao("");
        setAnoPublicacao("");
        setQuantidadePaginas("");
        setQuantidadeEstoque("");
        setCategoria("");
        setSubcategorias([""]);
        setAutores([""]);
        setCorCima("#000000");
        setCorBaixo("#FFFFFF");
        setEditora("");
        setCep("");
        setRua("");
        setBairro("");
        setNumero("");
        setCidade("");
        setEstado("");
        setCapaLivro(null);
        setCapaPreview(null);

        // Verifica se `onToggle` é uma função antes de chamar
        if (typeof onToggle === "function") {
          onToggle();
        }
      } else {
        console.log(
          "Erro ao cadastrar livro no servidor. Resposta não OK:",
          await response.json()
        );
        alert("Erro ao cadastrar livro.");
      }
    } catch (error) {
      console.error("Erro no bloco catch:", error);
      alert("Erro ao cadastrar livro. catch");
    }
  };

  const handleSubcategoriaChange = (index: number, value: string) => {
    const novasSubcategorias = [...subcategorias];
    novasSubcategorias[index] = value;
    setSubcategorias(novasSubcategorias);
  };

  const addSubcategoryInput = () => {
    setSubcategorias([...subcategorias, ""]);
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

  const handleCategoriaSelect = (categoriaNome: string) => {
    setCategoria(categoriaNome);
    const categoriaSelecionada = categoriaSugestoes.find(
      (cat) => cat.categoria_principal === categoriaNome
    );
    if (categoriaSelecionada) {
      setCorCima(categoriaSelecionada.cor_cima);
      setCorBaixo(categoriaSelecionada.cor_baixo);
    }
  };

  // Função para selecionar um autor específico no campo ativo
  const handleAutorSelect = (index: number, autor: string) => {
    const novosAutores = [...autores];
    novosAutores[index] = autor;
    setAutores(novosAutores); // Atualiza a lista de autores com o valor selecionado
    setShowAutorSugestoes(null); // Fecha a lista de sugestões
  };

  // Atualiza o campo de autor em edição
  const handleAutorChange = (index: number, value: string) => {
    const novosAutores = [...autores];
    novosAutores[index] = value;
    setAutores(novosAutores); // Atualiza o autor digitado
    setShowAutorSugestoes(index); // Exibe as sugestões apenas para o input ativo
  };

  const handleEditoraSelect = (editoraNome: string) => {
    setEditora(editoraNome);
    const editoraSelecionada = editoraSugestoes.find(
      (ed) => ed.nome_editora === editoraNome
    );
    if (editoraSelecionada) {
      setCep(editoraSelecionada.cep);
      setRua(editoraSelecionada.rua);
      setBairro(editoraSelecionada.bairro);
      setNumero(editoraSelecionada.numero);
      setCidade(editoraSelecionada.cidade);
      setEstado(editoraSelecionada.estado);
    }
    setShowEditoraSugestoes(false);
  };

  return (
    <div className={styles.containerCadastrar}>
      <h1 className={styles.titleCadastrar}>Cadastrar Livro</h1>

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

      <form className={styles.form} onSubmit={handleFormSubmit}>
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
            <Input
              label="Quantidade de Páginas"
              name="quantidade_paginas"
              type="number"
              value={quantidade_paginas}
              onChange={(e) => setQuantidadePaginas(e.target.value)}
            />
            <Input
              label="Quantidade em Estoque"
              name="quantidade_estoque"
              type="number"
              value={quantidade_estoque}
              onChange={(e) => setQuantidadeEstoque(e.target.value)}
            />
            <Input
              label="Categoria"
              name="categoria"
              type="text"
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              onFocus={() => setShowCategoriaSugestoes(true)}
            />
            <button
              type="button"
              onClick={() => setShowCategoriaSugestoes((prev) => !prev)}
              className={styles.dropdownButton}
            >
              ▼
            </button>
            {showCategoriaSugestoes && (
              <ul className={styles.suggestionList}>
                {categoriaSugestoes.map((sugestao, index) => (
                  <li
                    key={index}
                    onClick={() =>
                      handleCategoriaSelect(sugestao.categoria_principal)
                    }
                  >
                    {sugestao.categoria_principal}
                  </li>
                ))}
              </ul>
            )}

            <div className={styles.colorInputs}>
              <Input
                label="Cor Topo"
                name="corCima"
                type="color"
                value={corCima}
                onChange={(e) => setCorCima(e.target.value)}
              />
              <Input
                label="Cor Base"
                name="corBaixo"
                type="color"
                value={corBaixo}
                onChange={(e) => setCorBaixo(e.target.value)}
              />
            </div>

            <div
              className={styles.gradientPreview}
              style={{
                background: `linear-gradient(to bottom, ${corCima}, ${corBaixo})`,
              }}
            />
            <div
              className={styles.gradientPreview}
              style={{
                background: `linear-gradient(to bottom, ${corCima}, ${corBaixo})`,
                width: "800px",
                height: "150px",
                margin: "30px 10px",
              }}
            />

            <div>
              {subcategorias.map((subcategoria, index) => (
                <Input
                  label="SubCategorias"
                  key={index}
                  name={`subcategoria_${index}`}
                  type="text"
                  value={subcategoria}
                  onChange={(e) =>
                    handleSubcategoriaChange(index, e.target.value)
                  }
                />
              ))}
              <button
                className={styles.btSub}
                type="button"
                onClick={addSubcategoryInput}
              >
                Adicionar mais Subcategorias
              </button>
            </div>

            <div className={styles.inputContainer}>
              {autores.map((autor, index) => (
                <div key={index} className={styles.suggestionContainer}>
                  <Input
                    label="Autor"
                    name={`autor_${index}`}
                    type="text"
                    value={autor} // Exibe o valor do autor no campo específico
                    onChange={(e) => handleAutorChange(index, e.target.value)}
                    onFocus={() => setShowAutorSugestoes(index)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowAutorSugestoes(index)}
                    className={styles.dropdownButton}
                  >
                    ▼
                  </button>

                  {showAutorSugestoes === index && (
                    <ul className={styles.suggestionList}>
                      {autorSugestoes
                        .filter((sugestao) =>
                          sugestao
                            .toLowerCase()
                            .includes(autores[index]?.toLowerCase() || "")
                        )
                        .map((sugestao, sugIndex) => (
                          <li
                            key={sugIndex}
                            onClick={() => handleAutorSelect(index, sugestao)}
                          >
                            {sugestao}
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              ))}

              <button
                type="button"
                onClick={() => setAutores([...autores, ""])}
                className={styles.btAdd}
              >
                Adicionar Autor
              </button>
            </div>

            <Input
              label="Capa do Livro"
              name="capaLivro"
              type="file"
              accept="image/*"
              onChange={(e) => setCapaLivro(e.target.files?.[0] || null)}
            />
            {capaPreview && (
              <div className={styles.capaContainerLivro}>
                <img
                  src={capaPreview}
                  alt="Preview da capa do livro"
                  className={styles.capaPreview}
                />
              </div>
            )}
          </>
        ) : (
          <>
            <div className={styles.suggestionContainer}>
              <Input
                label="Editora"
                name="editora"
                type="text"
                value={editora}
                onChange={(e) => setEditora(e.target.value)}
                onFocus={() => setShowEditoraSugestoes(true)}
              />
              <button
                type="button"
                onClick={() => setShowEditoraSugestoes((prev) => !prev)}
                className={styles.dropdownButton}
              >
                ▼
              </button>
              {showEditoraSugestoes && (
                <ul className={styles.suggestionList}>
                  {Array.isArray(editoraSugestoes) &&
                    editoraSugestoes.map((ed, index) => (
                      <li
                        key={index}
                        onClick={() => handleEditoraSelect(ed.nome_editora)}
                      >
                        {ed.nome_editora}
                      </li>
                    ))}
                </ul>
              )}

              {/* Campos de Endereço da Editora */}
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
            </div>
          </>
        )}
        <FormButton />
      </form>
    </div>
  );
}
