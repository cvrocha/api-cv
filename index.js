import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Configuração inicial
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// Verificação CRÍTICA das variáveis
console.log('🔍 Variáveis carregadas:', {
  PORT: port,
  DEEPSEEK_KEY_PRESENT: !!process.env.DEEPSEEK_API_KEY
});

// Middlewares
app.use(cors());
app.use(express.json());

// Respostas locais
const LOCAL_FALLBACK = {
  "oi": "Olá! Eu sou o assistente virtual.",
  "default": "Serviço de IA indisponível no momento."
};

// Rota de saúde
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    deepseek: !!process.env.DEEPSEEK_API_KEY,
    serverTime: new Date().toISOString()
  });
});

// Rota principal
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Mensagem obrigatória' });
    }

    // Tentativa com DeepSeek
    if (process.env.DEEPSEEK_API_KEY) {
      try {
        const apiRes = await fetch('https://api.deepseek.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
          },
          body: JSON.stringify({
            model: 'deepseek-chat',
            messages: [{ role: 'user', content: message }]
          })
        });

        if (apiRes.ok) {
          const data = await apiRes.json();
          return res.json({
            reply: data.choices[0].message.content,
            source: 'deepseek'
          });
        }
      } catch (apiError) {
        console.error('Erro na API:', apiError.message);
      }
    }

    // Fallback
    res.json({
      reply: LOCAL_FALLBACK[message.toLowerCase()] || LOCAL_FALLBACK.default,
      source: 'local'
    });

  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: 'Falha no servidor' });
  }
});

// Inicialização
app.listen(port, () => {
  console.log(`✅ Servidor rodando em http://localhost:${port}`);
});