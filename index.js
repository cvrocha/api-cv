import express from 'express';
import dotenv from 'dotenv';
import OpenAI from 'openai';

// Carrega variáveis do .env
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Configuração segura da OpenAI
let openai;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
}

app.use(express.json());

// Rota GET
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    openai: !!openai
  });
});

// Rota POST com verificação segura
app.post('/chat', async (req, res) => {
  if (!openai) {
    return res.status(500).json({
      error: 'OpenAI não configurada',
      solution: 'Configure a OPENAI_API_KEY no Railway'
    });
  }

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