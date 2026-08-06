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

export interface CategoriaContagem {
  categoria_principal: string;
  quantidade: number;
}

export const fetchCategoriasPorQuantidade = async () => {
  try {
    const qs = new URLSearchParams({
      limite: "1",
      pagina: "1",
    });
    const response = await fetch(`${API_BASE}/livro?${qs.toString()}`);
    if (!response.ok) {
      throw new Error("Erro na requisição de contagem por categoria");
    }

    const data = await response.json();
    const categoriasContagem = Array.isArray(data?.categorias_contagem)
      ? data.categorias_contagem
      : [];

    return {
      categorias: categoriasContagem
        .filter((categoria: Partial<CategoriaContagem>) =>
          Boolean(categoria.categoria_principal)
        )
        .map((categoria: CategoriaContagem) => ({
          categoria_principal: categoria.categoria_principal,
          quantidade: Number(categoria.quantidade || 0),
        }))
        .sort(
          (a: CategoriaContagem, b: CategoriaContagem) =>
            b.quantidade - a.quantidade
        ),
    };
  } catch (error) {
    console.error("Erro ao carregar contagem por categoria:", error);
    return { categorias: [] };
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
