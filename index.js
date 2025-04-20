import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config(); // Carrega variáveis de ambiente do .env

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Respostas locais (fallback)
const LOCAL_RESPONSES = {
  "oi": "Olá! Como posso te ajudar hoje?",
  "qual é a capital do brasil": "A capital do Brasil é Brasília.",
  "como você está": "Estou funcionando perfeitamente, obrigado por perguntar!",
  "o que é inteligência artificial": "IA é a simulação de processos de inteligência humana por máquinas.",
  "default": "Desculpe, não consegui acessar o serviço de IA. Estou com respostas limitadas no momento."
};

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    deepseek: !!process.env.DEEPSEEK_API_KEY,
    timestamp: new Date().toISOString()
  });
});

// Rota raiz (só pra confirmar que o backend está de pé)
app.get('/', (req, res) => {
  res.send('🚀 API de chat está rodando! Use POST /api/chat');
});

// Função de fetch com timeout
const fetchWithTimeout = async (url, options = {}, timeout = 10000) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Timeout ao chamar a API DeepSeek')), timeout)
    )
  ]);
};

// Rota principal do chat
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Formato inválido', details: 'O campo "message" deve ser uma string' });
    }

    console.log(`Mensagem recebida: "${message}"`);

    // Tenta usar a API DeepSeek se houver chave
    if (process.env.DEEPSEEK_API_KEY) {
      try {
        const apiUrl = 'https://api.deepseek.com/v1/chat/completions';
        const requestBody = {
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: message }],
          temperature: 0.7
        };

        const response = await fetchWithTimeout(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
          },
          body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Erro na resposta da API:', errorText);
          throw new Error(`Erro da API: ${response.status}`);
        }

        const data = await response.json();

        return res.json({
          reply: data.choices[0].message.content,
          source: 'deepseek-api',
          model: data.model
        });

      } catch (err) {
        console.error('Erro ao chamar a API DeepSeek:', err.message);
      }
    }

    // Fallback local
    const reply = LOCAL_RESPONSES[message.toLowerCase()] || LOCAL_RESPONSES.default;
    res.json({ reply, source: 'local-fallback' });

  } catch (error) {
    console.error('Erro geral:', error.message);
    res.status(500).json({ error: 'Erro interno', details: error.message });
  }
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
});
