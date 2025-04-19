import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const port = process.env.PORT || 3000;

// Configuração reforçada
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware de timeout
app.use((req, res, next) => {
  req.setTimeout(5000, () => {
    res.status(504).json({ error: 'Timeout' });
  });
  next();
});

// Rota de saúde otimizada
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    deepseek: !!process.env.DEEPSEEK_API_KEY,
    serverTime: new Date().toISOString()
  });
});

// Rota principal com tratamento reforçado
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!process.env.DEEPSEEK_API_KEY) {
      return res.status(503).json({
        error: 'Service Unavailable',
        details: 'API key not configured'
      });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

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
      }),
      signal: controller.signal
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error: ${error}`);
    }

    const data = await response.json();
    res.json({
      reply: data.choices[0].message.content,
      source: 'deepseek-api'
    });

  } catch (error) {
    console.error('API Error:', error);
    res.status(502).json({
      error: 'Bad Gateway',
      details: error.message
    });
  }
});

// Inicialização segura
app.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
  console.log('🔍 Variáveis carregadas:', {
    PORT: port,
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY ? '***' + process.env.DEEPSEEK_API_KEY.slice(-4) : 'Não configurada'
  });
});