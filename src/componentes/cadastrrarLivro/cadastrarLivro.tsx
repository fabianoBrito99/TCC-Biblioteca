"use client"
import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import styles from './cadastrarLivro.module.css';

const CadastrarLivroForm = () => {
  const [imagePreview, setImagePreview] = useState<string>('./img/image.png');
  const [formData, setFormData] = useState({
    nome_livro: '',
    autor: '',
    categoria: '',
    descricao: '',
    quantidade: '',
    imagem_capa: null as File | null,
  });
  const [categories, setCategories] = useState<string[]>([]);

  // Função para pré-visualizar a imagem
  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
      setFormData({ ...formData, imagem_capa: file });
    } else {
      setImagePreview('./img/image.png');
    }
  };

  // Função para carregar categorias do backend
  useEffect(() => {
    fetch('http://127.0.0.1:4000/categorias')
      .then((response) => response.json())
      .then((data) => setCategories(data.categorias || []))
      .catch((error) => console.error('Erro ao carregar categorias:', error));
  }, []);

  // Função para manipular a mudança de campos do formulário
  const handleInputChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  // Função para envio do formulário
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();

    if (!formData.nome_livro || !formData.autor || !formData.categoria || !formData.descricao || !formData.quantidade || !formData.imagem_capa) {
      alert('Todos os campos são obrigatórios!');
      return;
    }

    const submitData = new FormData();
    submitData.append('nome_livro', formData.nome_livro);
    submitData.append('autor', formData.autor);
    submitData.append('categoria', formData.categoria);
    submitData.append('descricao', formData.descricao);
    submitData.append('quantidade', formData.quantidade);
    submitData.append('imagem_capa', formData.imagem_capa as Blob);

    fetch('http://127.0.0.1:4000/livro', {
      method: 'POST',
      body: submitData,
    })
      .then((response) => {
        if (!response.ok) throw new Error('Erro ao cadastrar livro');
        return response.json();
      })
      .then((result) => {
        alert('Livro cadastrado com sucesso!');
        setFormData({ nome_livro: '', autor: '', categoria: '', descricao: '', quantidade: '', imagem_capa: null });
        setImagePreview('./img/image.png');
      })
      .catch((error) => console.error('Erro ao cadastrar livro:', error));
  };

  return (
    <div className={styles.container_cad}>
      <h2 className={styles.title}>Cadastrar Livro</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.grid}>
          <div className={styles.formInputs}>
            <div className={styles.formGroup}>
              <input
                type="text"
                name="nome_livro"
                placeholder="Nome do Livro"
                value={formData.nome_livro}
                onChange={handleInputChange}
                required
              />
              <label className={styles.formLabel}>Nome do Livro</label>
            </div>
            <div className={styles.formGroup}>
              <input
                type="text"
                name="autor"
                placeholder="Autor"
                value={formData.autor}
                onChange={handleInputChange}
                required
              />
              <label className={styles.formLabel}>Autor</label>
            </div>
            <div className={styles.formGroup}>
              <input
                type="text"
                name="categoria"
                placeholder="Categoria"
                list="listCategories"
                value={formData.categoria}
                onChange={handleInputChange}
                required
              />
              <label className={styles.formLabel}>Categoria</label>
              <datalist id="listCategories">
                {categories.map((category) => (
                  <option key={category} value={category} />
                ))}
              </datalist>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Descrição</label>
              <textarea
                name="descricao"
                placeholder="Descrição"
                value={formData.descricao}
                onChange={handleInputChange}
                required
              />
            </div>
          </div>
          <div className={styles.formMedia}>
            <h2>Imagem da capa do livro</h2>
            <label htmlFor="imagem_capa" className={styles.uploadLabel}>
              <img className={styles.imgPreview} src={imagePreview} alt="Pré-visualização da Capa" />
              <input type="file" id="imagem_capa" name="imagem_capa" onChange={handleImageChange} hidden />
            </label>
            <input
              type="number"
              name="quantidade"
              placeholder="Quantidade"
              value={formData.quantidade}
              onChange={handleInputChange}
              required
            />
            <button type="submit" className={styles.button}>Salvar</button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CadastrarLivroForm;
