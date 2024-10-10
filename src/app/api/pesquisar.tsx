import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Missing query parameter' });
  }

  try {
    const response = await fetch(`http://localhost:4000/pesquisar?q=${q}`);
    const livros = await response.json();
    res.status(200).json(livros);
  } catch (error) {
    console.error('Erro ao buscar livros:', error);
    res.status(500).json({ error: 'Erro ao buscar livros' });
  }
}
