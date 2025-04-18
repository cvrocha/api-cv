import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();

// PORT deve ser 3000 (conforme sua variável no Railway)
const port = process.env.PORT || 3000;

// Configuração ESSENCIAL de CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS']
}));

// Middleware para parsear JSON
app.use(express.json());

// Rota GET de teste
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'API funcionando!',
    endpoints: {
      health_check: 'GET /health',
      chat: 'POST /api/chat'
    }
  });
});

// Rota de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

app.post('/api/chat', async (req, res) => {
  console.log('Recebida requisição POST em /api/chat');
  
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'O campo "message" é obrigatório' });
    }

    // Código REAL de integração com DeepSeek
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: message }],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      }
    );

    const reply = response.data.choices[0]?.message?.content;
    res.json({ reply });

  } catch (error) {
    console.error('Erro na API DeepSeek:', error.response?.data || error.message);
    
    let statusCode = 500;
    let errorMessage = 'Erro ao processar sua mensagem';

    if (error.response?.status === 429) {
      statusCode = 429;
      errorMessage = 'Limite de requisições excedido (tente novamente mais tarde)';
    }

    res.status(statusCode).json({
      error: errorMessage,
      details: error.response?.data || error.message
    });
  }
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`✅ Servidor rodando na porta ${port}`);
  console.log(`🔗 Health Check: https://api-cv-production.up.railway.app/health`);
  console.log(`✉️  Endpoint POST: https://api-cv-production.up.railway.app/api/chat`);
});