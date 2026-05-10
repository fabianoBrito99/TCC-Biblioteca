const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "https://api.helenaramazzotte.online";

export const fetchCategorias = async () => {
  try {
    const response = await fetch(`${API_BASE}/categorias`);
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
    const response = await fetch(`${API_BASE}/livro`);
    if (!response.ok) {
      throw new Error('Erro na requisição de livros');
    }
    return await response.json();
  } catch (error) {
    console.error('Erro ao carregar os livros:', error);
    return { dados: [] };
  }
};

export const fetchLivrosPorCategoria = async (categoria: string, limite = 15) => {
  try {
    const qs = new URLSearchParams({
      categoria,
      limite: String(limite),
      pagina: "1",
    });
    const response = await fetch(`${API_BASE}/livro?${qs.toString()}`);
    if (!response.ok) {
      throw new Error("Erro na requisição de livros por categoria");
    }
    return await response.json();
  } catch (error) {
    console.error("Erro ao carregar livros por categoria:", error);
    return { livros: [] };
  }
};
