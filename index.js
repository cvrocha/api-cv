import express from 'express';
import { config } from 'dotenv';
import OpenAI from 'openai';

config(); // Carrega variáveis do .env

const app = express();
const port = process.env.PORT || 3000;

// Configurar OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota GET
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'API rodando!',
    endpoints: {
      GET: '/',
      POST: '/api/chat'
    }
  });
});

// Rota POST com OpenAI
app.post('/api/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages
    });

    const resposta = completion.choices[0].message.content;

    res.json({
      status: 'success',
      response: resposta
    });
  } catch (error) {
    console.error('Erro:', error);
    res.status(500).json({
      status: 'error',
      message: 'Erro ao gerar resposta',
      error: error.message
    });
  }
});

// Rota 404
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Rota não existe',
    tried: {
      method: req.method,
      path: req.path
    }
  });
});

app.listen(port, () => {
  console.log(`✅ Servidor rodando em http://localhost:${port}`);
});
