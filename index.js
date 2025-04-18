import express from 'express';
import cors from 'cors';

const app = express();
const port = process.env.PORT || 3000;

// Configuração robusta
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS']
}));

app.use(express.json());

// Respostas locais como fallback
const LOCAL_RESPONSES = {
  "oi": "Olá! Como posso te ajudar hoje?",
  "qual é a capital do brasil": "A capital do Brasil é Brasília.",
  "como você está": "Estou funcionando perfeitamente, obrigado por perguntar!",
  "o que é inteligência artificial": "IA é a simulação de processos de inteligência humana por máquinas.",
  "default": "Desculpe, não consegui acessar o serviço de IA. Estou com respostas limitadas no momento."
};

// Rota de status
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    features: {
      local_fallback: true,
      deepseek_integration: false
    },
    timestamp: new Date().toISOString()
  });
});

// Rota principal com fallback
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        error: 'Formato inválido',
        details: 'O campo "message" deve ser uma string não vazia'
      });
    }

    // Tenta primeiro a API do DeepSeek (se tiver chave)
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
        console.error('Falha na API DeepSeek:', apiError.message);
      }
    }

    // Fallback para respostas locais
    const lowerMessage = message.toLowerCase();
    const reply = LOCAL_RESPONSES[lowerMessage] || LOCAL_RESPONSES['default'];
    
    res.json({
      reply,
      source: 'local-fallback',
      info: 'Serviço de IA temporariamente indisponível'
    });

  } catch (error) {
    console.error('Erro geral:', error);
    res.status(500).json({
      error: 'Erro interno',
      details: process.env.NODE_ENV === 'development' ? error.message : null
    });
  }
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
  console.log('🔍 Endpoints:');
  console.log(`- POST http://localhost:${port}/api/chat`);
  console.log(`- GET  http://localhost:${port}/health`);
  console.log('\n💡 Dica: Configure DEEPSEEK_API_KEY para ativar a integração completa');
});