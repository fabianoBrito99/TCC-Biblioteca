CREATE DATABASE IF NOT EXISTS biblioteca_tcc;
USE biblioteca_tcc;
select * from Livro;


SELECT * FROM livro;


ALTER TABLE Emprestimos ADD COLUMN status ENUM('pendente', 'aprovado', 'concluido') DEFAULT 'pendente';
INSERT INTO Endereco (cep, rua, numero, bairro, cidade, estado) 
VALUES ('12345-678', 'Rua da Paz', 123, 'Centro', 'São Paulo', 'SP');


INSERT INTO Editora (nome_editora, fk_id_endereco) 
VALUES ('Editora Café com Deus', 1);

INSERT INTO Estoque (quantidade_estoque) 
VALUES (2);

INSERT INTO Livro (nome_livro, descricao, ano_publicacao, quantidade_paginas, fk_id_estoque, fk_id_editora) 
VALUES ('Café com Deus Pai', 'Uma descrição sobre o livro Café com Deus Pai.', '2024-11-04', 200, 1, 1);

SELECT * from resposta_comentario;

-- Inserir usuário Jorge na tabela Usuario
INSERT INTO Usuario (nome_login, email, senha, telefone, igreja_local, tipo_usuario, fk_id_avaliacoes)
VALUES ('jorge', 'jorge@example.com', '1234', 123456789, 'Igreja Central', 'leitor', NULL);

-- Inserir endereço na tabela Endereco
INSERT INTO Endereco (cep, rua, numero, bairro, cidade, estado)
VALUES ('12345-678', 'Rua Principal', 123, 'Centro', 'Cidade Exemplo', 'Estado Exemplo');

-- Associar o usuário Jorge ao endereço inserido
-- Supondo que o id_usuario e id_endereco sejam os últimos registros inseridos
INSERT INTO Usuario_Endereco (fk_id_usuario, fk_id_endereco)
VALUES (LAST_INSERT_ID(), LAST_INSERT_ID());



INSERT INTO Categoria (nome_categoria) 
VALUES ('Devocional');

INSERT INTO Livro_Categoria (fk_id_livros, fk_id_categoria) 
VALUES (3, 1);



SELECT 
    comentarios.id_comentario,
    comentarios.comentario,
    comentarios.data_comentario,
    usuario.nome AS nome_login,
    livros.nome_livro AS nome_livro
FROM 
    comentarios
JOIN 
    usuario ON comentarios.fk_id_usuario = 1
JOIN 
    livros ON comentarios.fk_id_livro = 3
ORDER BY 
    comentarios.data_comentario DESC;


SELECT * FROM Comentarios_livro WHERE fk_id_livro = 3;


SELECT *
     FROM curtida_comentario;
     
     

    
drop DATABASE biblioteca_tcc;






INSERT INTO Comunidade (nome, descricao, objetivo, tipo, id_adm) VALUES("leitura", "AAAAAAAAAAAAAAAAAAAAA", "ler","publica", 1);



select * from emprestimos;
UPDATE Estoque SET quantidade_estoque = quantidade_estoque + 5 WHERE id_estoque = (SELECT fk_id_estoque FROM Livro WHERE id_livro = 9);


UPDATE emprestimos 
SET data_prevista_devolucao = '2024-11-30' 
WHERE fk_id_livros = 1;



ALTER TABLE Avaliacoes ADD COLUMN fk_id_usuario INT;

-- Tabela Avaliacoes
CREATE TABLE Avaliacoes (
    id_avaliacoes INT PRIMARY KEY AUTO_INCREMENT,
    nota DOUBLE,
    comentario VARCHAR(255),
    data_avaliacao DATE,
    fk_id_usuario INT
);

-- Tabela Usuario
CREATE TABLE Usuario (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    nome_login VARCHAR(20),
    email VARCHAR(100),
    senha VARCHAR(255),
    telefone VARCHAR(20),
    data_nascimento DATE,
    igreja_local VARCHAR(20),
    foto_usuario MEDIUMBLOB,
    tipo_usuario VARCHAR(10) default "leitor",
    fk_id_avaliacoes INT,
    FOREIGN KEY (fk_id_avaliacoes) REFERENCES Avaliacoes(id_avaliacoes)
);

-- Tabela Endereco
CREATE TABLE Endereco (
    id_endereco INT PRIMARY KEY AUTO_INCREMENT,
    cep VARCHAR(15),
    rua VARCHAR(45),
    numero INT,
    bairro VARCHAR(20),
    cidade VARCHAR(20),
    estado VARCHAR(20)
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
    foto_capa MEDIUMBLOB,
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
    categoria_principal VARCHAR(45),
    cor_cima VARCHAR(7),
    cor_baixo VARCHAR(7)
);
-- Tabela Subcategoria
CREATE TABLE Subcategoria (
    id_subcategoria INT PRIMARY KEY AUTO_INCREMENT,
    nome_subcategoria VARCHAR(20),
    fk_id_categoria INT,
    FOREIGN KEY (fk_id_categoria) REFERENCES Categoria(id_categoria)
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

-- Tabela Comunidade (para informações de comunidade)
CREATE TABLE IF NOT EXISTS Comunidade (
    id_comunidade INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,            -- Nome da Comunidade
    descricao TEXT NULL,                   -- Descrição
    objetivo VARCHAR(100) NULL,            -- Objetivo
    tipo VARCHAR(15) NULL,                 -- "publica" ou "privada"
    id_adm INT NOT NULL,                   -- ID do administrador (criador)
    FOREIGN KEY (id_adm) REFERENCES Usuario (id_usuario)
) ENGINE = InnoDB;

-- Tabela Avaliacoes_livro
CREATE TABLE IF NOT EXISTS Avaliacoes_livro (
    id_avaliacoes_livro INT PRIMARY KEY AUTO_INCREMENT,
    fk_id_avaliacoes INT NOT NULL,
    fk_id_livro INT NOT NULL,
    FOREIGN KEY (fk_id_avaliacoes) REFERENCES Avaliacoes (id_avaliacoes),
    FOREIGN KEY (fk_id_livro) REFERENCES Livro (id_livro)
) ENGINE = InnoDB;

-- Tabela Comunidade_usuario (para membros da comunidade)
CREATE TABLE IF NOT EXISTS Comunidade_usuario (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fk_id_comunidade INT NOT NULL,
    fk_id_usuario INT NOT NULL,
    status VARCHAR(15) NOT NULL DEFAULT 'pendente', -- status: "pendente", "aceito", ou "rejeitado"
    FOREIGN KEY (fk_id_comunidade) REFERENCES Comunidade (id_comunidade),
    FOREIGN KEY (fk_id_usuario) REFERENCES Usuario (id_usuario)
) ENGINE = InnoDB;

-- Tabela Progresso (para registrar progresso diário)
CREATE TABLE IF NOT EXISTS Progresso (
    id_progresso INT PRIMARY KEY AUTO_INCREMENT,
    fk_id_usuario INT NOT NULL,
    fk_id_comunidade INT NOT NULL,
    paginas_lidas INT NOT NULL,           -- Quantidade de páginas lidas no dia
    data DATE NOT NULL,                   -- Data do progresso
    FOREIGN KEY (fk_id_usuario) REFERENCES Usuario (id_usuario),
    FOREIGN KEY (fk_id_comunidade) REFERENCES Comunidade (id_comunidade)
) ENGINE = InnoDB;

-- Tabela Comentarios
CREATE TABLE IF NOT EXISTS Comentarios (
    id_comentario INT PRIMARY KEY AUTO_INCREMENT,
    comentario TEXT NULL,
    data_comentario DATETIME
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
    fk_id_usuario INT NOT NULL,
    FOREIGN KEY (fk_id_comentario) REFERENCES Comentarios (id_comentario),
    FOREIGN KEY (fk_id_usuario) REFERENCES Usuario (id_usuario)
);

-- Tabela resposta_comentario
CREATE TABLE IF NOT EXISTS resposta_comentario (
    id_resposta_comentario INT PRIMARY KEY AUTO_INCREMENT,
    resposta VARCHAR(255) NULL,
    data_resposta DATETIME,
    fk_id_usuario INT NOT NULL,
    fk_id_comentario INT NOT NULL,
    FOREIGN KEY (fk_id_usuario) REFERENCES Usuario (id_usuario),
    FOREIGN KEY (fk_id_comentario) REFERENCES Comentarios (id_comentario)
);

CREATE TABLE Sugestoes (
    id_sugestao INT PRIMARY KEY AUTO_INCREMENT,
    autor VARCHAR(200) NULL,
    nome_livro VARCHAR(255) NULL,
    descricao_livro TEXT,
    motivo_sugestao TEXT,
    data_sugestao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fk_id_usuario INT,
    CONSTRAINT fk_usuario_sugestao FOREIGN KEY (fk_id_usuario) REFERENCES Usuario(id_usuario)
);

-- Tabela Notificacoes
CREATE TABLE IF NOT EXISTS Notificacoes (
    id_notificacao INT PRIMARY KEY AUTO_INCREMENT,
    fk_id_usuario INT NOT NULL,
    tipo VARCHAR(50) NOT NULL, -- "vencimento_livro", "mensagem_comunidade", "lembrete_leitura"
    mensagem TEXT NOT NULL,
    data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP,
    lida BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (fk_id_usuario) REFERENCES Usuario(id_usuario)
);


INSERT INTO Notificacoes (mensagem, tipo, data_criacao, lida, fk_id_usuario)
VALUES ('o prazo para devolver o livro está se aproximando, se atente para devolver no prazo🥰!', 'livro', NOW(), 0, 3);


select * from emprestimos;



