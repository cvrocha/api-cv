import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Configuração inicial
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Verificação de variáveis
console.log('Variáveis carregadas:', {
  PORT: port,
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY ? '***' + process.env.DEEPSEEK_API_KEY.slice(-4) : 'Não configurada'
});

// Rotas
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    deepseek: !!process.env.DEEPSEEK_API_KEY,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/chat', async (req, res) => {
  try {
    if (!process.env.DEEPSEEK_API_KEY) {
      return res.status(503).json({
        message: 'Serviço indisponível',
        details: 'Chave da API não configurada'
      });
    }

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: req.body.message }],
        temperature: 0.7
      })
    });

    const data = await response.json();
    res.json(data.choices[0].message.content);

  } catch (error) {
    console.error('Erro na API:', error);
    res.status(500).json({ error: 'Erro interno' });
  }
});

app.listen(port, () => {
  console.log(`✅ Servidor rodando na porta ${port}`);
});