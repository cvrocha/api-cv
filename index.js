import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const port = process.env.PORT || 3000;

// Configuração robusta de CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

// Middleware para parsear JSON
app.use(express.json());

// Middleware para log de requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Rota de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    message: 'API DeepSeek integrada e funcionando',
    timestamp: new Date().toISOString()
  });
});

// Rota principal de chat
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;

    // Validação do input
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: 'Parâmetro inválido',
        details: 'O campo "message" é obrigatório e deve ser uma string'
      });
    }

    console.log(`Processando mensagem: "${message.substring(0, 30)}..."`);

    // Configuração da requisição para DeepSeek
    const response = await axios.post(
      'https://api.deepseek.com/v1/chat/completions',
      {
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'Você é um assistente prestativo que responde em português brasileiro.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000 // 15 segundos de timeout
      }
    );

    // Validação da resposta
    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Resposta da API em formato inesperado');
    }

    const reply = response.data.choices[0].message.content;

    console.log('Resposta gerada com sucesso');
    res.json({ reply });

  } catch (error) {
    console.error('Erro na requisição:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    });

    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.error?.message || 'Erro ao processar sua mensagem';

    res.status(statusCode).json({
      error: errorMessage,
      details: {
        type: error.name,
        message: error.message,
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
      }
    });
  }
});

// Rota de fallback para 404
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    available_routes: {
      GET: ['/health'],
      POST: ['/api/chat']
    }
  });
});

// Inicialização do servidor
app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
  console.log(`🔍 Health check: http://localhost:${port}/health`);
  console.log(`✉️  Endpoint chat: http://localhost:${port}/api/chat`);
});