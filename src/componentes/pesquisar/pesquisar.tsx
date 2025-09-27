import React, { useState } from 'react';

const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [sugestoes, setSugestoes] = useState<string[]>([]);

  const handleInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.trim();
    setQuery(query);

    if (query.length > 0) {
      try {
        const response = await fetch(`https://api.helenaramazzotte.online/api/pesquisar?q=${query}`);
        const livros = await response.json();
        setSugestoes(livros.map((livro: { nome_livro: string }) => livro.nome_livro));
      } catch (error) {
        console.error('Erro ao buscar sugestões:', error);
      }
    } else {
      setSugestoes([]);
    }
  };

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={handleInput}
        placeholder="Pesquisar livro"
      />
      <div>
        {sugestoes.length > 0 ? (
          sugestoes.map((sugestao, index) => (
            <div key={index} onClick={() => window.location.href = `/consultarLivro?id=${index}`}>
              {sugestao}
            </div>
          ))
        ) : (
          <div>Nenhum livro encontrado</div>
        )}
      </div>
    </div>
  );
};

export default SearchBar;
