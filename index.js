import express from 'express';
import dotenv from 'dotenv';
import OpenAI from 'openai';

// 1. Carrega variáveis do .env
dotenv.config();

// 2. Verificação rigorosa da chave
const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim();

if (!OPENAI_API_KEY || !OPENAI_API_KEY.startsWith('sk-')) {
  console.error(`
  ❌ ERRO: Chave OpenAI inválida ou ausente!
  
  Certifique-se de:
  1. Criar um arquivo .env na raiz do projeto
  2. Adicionar: OPENAI_API_KEY=sua-chave-aqui
  3. NUNCA commitar o arquivo .env
  `);
  process.exit(1);
}

// 3. Configuração do Express e OpenAI
const app = express();
const port = process.env.PORT || 3000;
const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

app.use(express.json());

// Rotas
app.get('/', (req, res) => {
  res.json({ 
    status: 'online',
    message: 'API segura com variáveis de ambiente'
  });
});

app.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages) {
      return res.status(400).json({ error: 'Messages é obrigatório' });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages
    });

    res.json(response.choices[0].message);
  } catch (error) {
    console.error('Erro OpenAI:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});