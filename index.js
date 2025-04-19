import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Configuração inicial
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Middlewares essenciais
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS']
}));
app.use(express.json());

// Respostas locais (fallback)
const LOCAL_RESPONSES = {
  "oi": "Olá! Como posso te ajudar hoje?",
  "qual é a capital do brasil": "A capital do Brasil é Brasília.",
  "default": "Desculpe, não consegui acessar o serviço de IA."
};

// Rota de saúde
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    deepseek_configured: !!process.env.DEEPSEEK_API_KEY,
    timestamp: new Date().toISOString()
  });
});

// Rota principal
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'O campo "message" é obrigatório' });
    }

    // Tenta usar a API DeepSeek se a chave existir
    if (process.env.DEEPSEEK_API_KEY) {
      try {
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

        if (response.ok) {
          const data = await response.json();
          return res.json({
            reply: data.choices[0].message.content,
            source: 'deepseek-api'
          });
        }
      } catch (apiError) {
        console.error('Erro na API DeepSeek:', apiError.message);
      }
    }

    // Fallback local
    const reply = LOCAL_RESPONSES[message.toLowerCase()] || LOCAL_RESPONSES['default'];
    res.json({
      reply,
      source: 'local-fallback',
      info: process.env.DEEPSEEK_API_KEY 
        ? 'Serviço de IA temporariamente indisponível' 
        : 'Integração não configurada'
    });

  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`✅ Servidor rodando na porta ${port}`);
  console.log('🔍 Endpoints:');
  console.log(`- POST http://localhost:${port}/api/chat`);
  console.log(`- GET  http://localhost:${port}/health`);
});