-- Script SQL para atualizar a tabela de clientes com os novos campos
-- Execute este script no SQL Editor do seu projeto Supabase

ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS cep TEXT,
ADD COLUMN IF NOT EXISTS street TEXT,
ADD COLUMN IF NOT EXISTS number TEXT,
ADD COLUMN IF NOT EXISTS complement TEXT,
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS dob DATE,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS children TEXT,
ADD COLUMN IF NOT EXISTS profession TEXT,
ADD COLUMN IF NOT EXISTS photo TEXT;

-- Comentários para documentação (opcional)
COMMENT ON COLUMN clients.cep IS 'Código de Endereçamento Postal';
COMMENT ON COLUMN clients.street IS 'Nome da rua/logradouro';
COMMENT ON COLUMN clients.number IS 'Número da residência';
COMMENT ON COLUMN clients.complement IS 'Complemento do endereço';
COMMENT ON COLUMN clients.neighborhood IS 'Bairro';
COMMENT ON COLUMN clients.city IS 'Cidade';
COMMENT ON COLUMN clients.state IS 'Estado (UF)';
COMMENT ON COLUMN clients.dob IS 'Data de Nascimento';
COMMENT ON COLUMN clients.gender IS 'Gênero do cliente';
COMMENT ON COLUMN clients.children IS 'Quantidade de filhos';
COMMENT ON COLUMN clients.profession IS 'Profissão do cliente';
COMMENT ON COLUMN clients.photo IS 'URL da foto do cliente';
