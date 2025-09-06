export const fetchCategorias = async () => {
  try {
    const response = await fetch('https://api.helenaramazzotte.online/categorias');
    if (!response.ok) {
      throw new Error('Erro na requisição de categorias');
    }
    return await response.json();
  } catch (error) {
    console.error('Erro ao carregar as categorias:', error);
    return { categorias: [] };
  }
};

export const fetchLivros = async () => {
  try {
    const response = await fetch('https://api.helenaramazzotte.online/livro');
    if (!response.ok) {
      throw new Error('Erro na requisição de livros');
    }
    return await response.json();
  } catch (error) {
    console.error('Erro ao carregar os livros:', error);
    return { dados: [] };
  }
};
