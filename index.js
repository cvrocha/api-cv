import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
const port = process.env.PORT || 3000;

// Middleware para garantir headers JSON
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json');
  next();
});

app.use(cors());
app.use(express.json());

// Log das variáveis de ambiente ao iniciar (para debug)
console.log('Variáveis de ambiente carregadas:', {
  PORT: process.env.PORT,
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY ? '***' + process.env.DEEPSEEK_API_KEY.slice(-4) : 'NÃO CONFIGURADA'
});

// Fallback local
const LOCAL_RESPONSES = {
  "oi": "Olá! Como posso te ajudar hoje?",
  "default": "Desculpe, não consegui acessar o serviço de IA. Estou com respostas limitadas no momento."
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

    // Se a chave da API estiver configurada
    if (process.env.DEEPSEEK_API_KEY) {
      console.log('Tentando conectar à API DeepSeek...');
      
      const apiResponse = await fetch('https://api.deepseek.com/v1/chat/completions', {
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

      if (apiResponse.ok) {
        const data = await apiResponse.json();
        return res.json({ 
          reply: data.choices[0].message.content,
          source: 'deepseek-api'
        });
      } else {
        console.error('Erro na API DeepSeek:', await apiResponse.text());
      }
    }

    // Fallback local
    const lowerMessage = message.toLowerCase();
    res.json({
      reply: LOCAL_RESPONSES[lowerMessage] || LOCAL_RESPONSES['default'],
      source: 'local-fallback',
      info: process.env.DEEPSEEK_API_KEY 
        ? 'Erro temporário na API DeepSeek' 
        : 'Chave da API não configurada'
    });

  } catch (error) {
    console.error('Erro interno:', error);
    res.status(500).json({ error: 'Erro no servidor' });
  }
});

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
  console.log('Configure DEEPSEEK_API_KEY para ativar a integração completa');
});