CREATE DATABASE IF NOT EXISTS biblioteca_tcc;
USE biblioteca_tcc;

-- Tabela Avaliacoes
CREATE TABLE Avaliacoes (
    id_avaliacoes INT PRIMARY KEY AUTO_INCREMENT,
    nota DOUBLE,
    comentario VARCHAR(255),
    data_avaliacao DATE
);

-- Tabela Usuario
CREATE TABLE Usuario (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    nome_login VARCHAR(20),
    email VARCHAR(100),
    senha VARCHAR(255),
    telefone INT,
    igreja_local VARCHAR(20),
    foto_usuario VARCHAR(100),
    tipo_usuario VARCHAR(10),
    fk_id_avaliacoes INT,
    FOREIGN KEY (fk_id_avaliacoes) REFERENCES Avaliacoes(id_avaliacoes)
);

-- Tabela Endereco
CREATE TABLE Endereco (
    id_endereco INT PRIMARY KEY AUTO_INCREMENT,
    cep VARCHAR(15),
    rua VARCHAR(45),
    numero INT,
    bairro VARCHAR(20)
);

-- Tabela Usuario_Endereco (Relacionamento entre Usuario e Endereco)
CREATE TABLE Usuario_Endereco (
    fk_id_usuario INT,
    fk_id_endereco INT,
    PRIMARY KEY (fk_id_usuario, fk_id_endereco),
    FOREIGN KEY (fk_id_usuario) REFERENCES Usuario(id_usuario),
    FOREIGN KEY (fk_id_endereco) REFERENCES Endereco(id_endereco)
);

-- Tabela Estoque
CREATE TABLE Estoque (
    id_estoque INT PRIMARY KEY AUTO_INCREMENT,
    quantidade_estoque INT
);

-- Tabela Editora
CREATE TABLE Editora (
    id_editora INT PRIMARY KEY AUTO_INCREMENT,
    nome_editora VARCHAR(45),
    fk_id_endereco INT,
    FOREIGN KEY (fk_id_endereco) REFERENCES Endereco(id_endereco)
);

-- Tabela Livro
CREATE TABLE Livro (
    id_livro INT PRIMARY KEY AUTO_INCREMENT,
    nome_livro VARCHAR(100),
    foto_capa VARCHAR(100),
    descricao TEXT,
    ano_publicacao DATE,
    quantidade_paginas INT,
    fk_id_estoque INT,
    fk_id_editora INT,
    FOREIGN KEY (fk_id_estoque) REFERENCES Estoque(id_estoque),
    FOREIGN KEY (fk_id_editora) REFERENCES Editora(id_editora)
);

-- Tabela Emprestimos
CREATE TABLE Emprestimos (
    id_emprestimo INT PRIMARY KEY AUTO_INCREMENT,
    data_emprestimo DATE,
    data_prevista_devolucao DATE,
    data_devolucao DATE,
    fk_id_livros INT,
    FOREIGN KEY (fk_id_livros) REFERENCES Livro(id_livro)
);

-- Tabela Usuario_Emprestimos (Relacionamento entre Usuario e Emprestimos)
CREATE TABLE Usuario_Emprestimos (
    fk_id_usuario INT,
    fk_id_emprestimo INT,
    FOREIGN KEY (fk_id_usuario) REFERENCES Usuario(id_usuario),
    FOREIGN KEY (fk_id_emprestimo) REFERENCES Emprestimos(id_emprestimo)
);

-- Tabela Categoria
CREATE TABLE Categoria (
    id_categoria INT PRIMARY KEY AUTO_INCREMENT,
    nome_categoria VARCHAR(45)
);

-- Tabela Livro_Categoria (Relacionamento entre Livro e Categoria)
CREATE TABLE Livro_Categoria (
    id_livro_categoria INT PRIMARY KEY AUTO_INCREMENT,
    fk_id_livros INT,
    fk_id_categoria INT,
    FOREIGN KEY (fk_id_livros) REFERENCES Livro(id_livro),
    FOREIGN KEY (fk_id_categoria) REFERENCES Categoria(id_categoria)
);

-- Tabela Historico
CREATE TABLE Historico (
    id_historico INT PRIMARY KEY AUTO_INCREMENT,
    data_historico DATE,
    fk_id_livros INT,
    fk_id_emprestimo INT,
    FOREIGN KEY (fk_id_livros) REFERENCES Livro(id_livro),
    FOREIGN KEY (fk_id_emprestimo) REFERENCES Emprestimos(id_emprestimo)
);

-- Tabela Autor
CREATE TABLE Autor (
    id_autor INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(45)
);

-- Tabela Autor_Livros (Relacionamento entre Autor e Livro)
CREATE TABLE Autor_Livros (
    id_autor_livros INT PRIMARY KEY AUTO_INCREMENT,
    fk_id_autor INT,
    fk_id_livros INT,
    FOREIGN KEY (fk_id_autor) REFERENCES Autor(id_autor),
    FOREIGN KEY (fk_id_livros) REFERENCES Livro(id_livro)
);

-- Tabela Comentarios
CREATE TABLE IF NOT EXISTS Comentarios (
    id_comentario INT PRIMARY KEY AUTO_INCREMENT,
    comentario TEXT NULL
) ENGINE = InnoDB;

-- Tabela Comunidade
CREATE TABLE IF NOT EXISTS Comunidade (
    id_comunidade INT PRIMARY KEY AUTO_INCREMENT,
    objetivo VARCHAR(100) NULL,
    tipo VARCHAR(15) NULL
) ENGINE = InnoDB;

-- Tabela Avaliacoes_livro
CREATE TABLE IF NOT EXISTS Avaliacoes_livro (
    id_avaliacoes_livro INT PRIMARY KEY AUTO_INCREMENT,
    fk_id_avaliacoes INT NOT NULL,
    fk_id_livro INT NOT NULL,
    FOREIGN KEY (fk_id_avaliacoes) REFERENCES Avaliacoes (id_avaliacoes),
    FOREIGN KEY (fk_id_livro) REFERENCES Livro (id_livro)
) ENGINE = InnoDB;

-- Tabela Comunidade_usuario
CREATE TABLE IF NOT EXISTS Comunidade_usuario (
    fk_comunidade_usuario INT PRIMARY KEY AUTO_INCREMENT,
    fk_id_comunidade INT NOT NULL,
    fk_id_usuario INT UNSIGNED NOT NULL,
    FOREIGN KEY (fk_id_comunidade) REFERENCES Comunidade (id_comunidade),
    FOREIGN KEY (fk_id_usuario) REFERENCES Usuario (id_usuario)
) ENGINE = InnoDB;

-- Tabela Comentarios_livro
CREATE TABLE IF NOT EXISTS Comentarios_livro (
    id_comentarios_livro INT PRIMARY KEY AUTO_INCREMENT,
    fk_id_comentario INT NOT NULL,
    fk_id_livro INT NOT NULL,
    FOREIGN KEY (fk_id_comentario) REFERENCES Comentarios (id_comentario),
    FOREIGN KEY (fk_id_livro) REFERENCES Livro (id_livro)
) ENGINE = InnoDB;

-- Tabela Comunidade_livro
CREATE TABLE IF NOT EXISTS Comunidade_livro (
	id_comunidade_livro INT PRIMARY KEY AUTO_INCREMENT,
    fk_id_comunidade INT NOT NULL,
    fk_id_livro INT NOT NULL,
    FOREIGN KEY (fk_id_comunidade) REFERENCES Comunidade (id_comunidade),
    FOREIGN KEY (fk_id_livro) REFERENCES Livro (id_livro)
) ENGINE = InnoDB;

-- Tabela Comentarios_Comunidade
CREATE TABLE IF NOT EXISTS Comentarios_Comunidade (
    id_comentarios_comunidade INT PRIMARY KEY AUTO_INCREMENT,
    fk_id_comentario INT NOT NULL,
    fk_id_comunidade INT NOT NULL,
    FOREIGN KEY (fk_id_comentario) REFERENCES Comentarios (id_comentario),
    FOREIGN KEY (fk_id_comunidade) REFERENCES Comunidade (id_comunidade)
);

-- Tabela Comentarios_usuario
CREATE TABLE IF NOT EXISTS Comentarios_usuario (
    id_comentarios_usuario INT PRIMARY KEY AUTO_INCREMENT,
    fk_id_comentario INT NOT NULL,
    fk_id_usuario INT NOT NULL,
    FOREIGN KEY (fk_id_comentario) REFERENCES Comentarios (id_comentario),
    FOREIGN KEY (fk_id_usuario) REFERENCES Usuario (id_usuario)
);

-- Tabela curtida_comentario
CREATE TABLE IF NOT EXISTS curtida_comentario (
    id_curtida INT PRIMARY KEY AUTO_INCREMENT,
    qtdCurtida INT NULL,
    fk_id_comentario INT NOT NULL,
    fk_id_usuario INT UNSIGNED NOT NULL,
    FOREIGN KEY (fk_id_comentario) REFERENCES Comentarios (id_comentario),
    FOREIGN KEY (fk_id_usuario) REFERENCES Usuario (id_usuario)
);

-- Tabela resposta_comentario
CREATE TABLE IF NOT EXISTS resposta_comentario (
    id_resposta_comentario INT PRIMARY KEY AUTO_INCREMENT,
    resposta VARCHAR(255) NULL,
    fk_id_usuario INT UNSIGNED NOT NULL,
    fk_id_comentario INT NOT NULL,
    FOREIGN KEY (fk_id_usuario) REFERENCES Usuario (id_usuario),
    FOREIGN KEY (fk_id_comentario) REFERENCES Comentarios (id_comentario)
);
