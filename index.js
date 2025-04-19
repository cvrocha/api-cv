import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Configuração inicial
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS']
}));
app.use(express.json());

// Verificação CRÍTICA das variáveis
console.log('🔍 Variáveis carregadas:', {
  PORT: port,
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY ? '***' + process.env.DEEPSEEK_API_KEY.slice(-4) : 'NÃO CONFIGURADA'
});

// Rotas
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    domain: 'api-cv-production.up.railway.app',
    deepseek_configured: !!process.env.DEEPSEEK_API_KEY,
    timestamp: new Date().toISOString()
  });
});

app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Campo "message" é obrigatório' });
    }

    if (!process.env.DEEPSEEK_API_KEY) {
      console.error('Erro: DEEPSEEK_API_KEY não configurada');
      return res.status(503).json({
        error: 'Serviço indisponível',
        details: 'Integração com DeepSeek não configurada'
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
        messages: [{ role: 'user', content: message }],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Erro na API DeepSeek:', error);
      throw new Error(`API Status: ${response.status}`);
    }

    const data = await response.json();
    res.json({
      reply: data.choices[0].message.content,
      source: 'deepseek-api'
    });

  } catch (error) {
    console.error('Erro no endpoint /api/chat:', error);
    res.status(500).json({
      error: 'Erro interno',
      details: process.env.NODE_ENV !== 'production' ? error.message : null
    });
  }
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
  console.log('🔍 Endpoints disponíveis:');
  console.log(`- POST /api/chat`);
  console.log(`- GET /health`);
  console.log('\n💡 Verifique os logs para confirmar as variáveis de ambiente');
});