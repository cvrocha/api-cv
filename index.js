import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const port = process.env.PORT || 3000;

// Configuração do DeepSeek (com fallback para endpoints alternativos)
const DEEPSEEK_API_ENDPOINTS = [
  'https://api.deepseek.com/v1/chat/completions',
  'https://chat.deepseek.com/api/v1/chat'
];
let currentEndpointIndex = 0;

// Configuração robusta de CORS para o Railway
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Middleware para parsear JSON
app.use(express.json());

// Middleware para requisições OPTIONS (pré-flight)
app.options('*', cors());

// Rota de status (teste de saúde)
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    provider: 'DeepSeek (gratuito)',
    current_endpoint: DEEPSEEK_API_ENDPOINTS[currentEndpointIndex],
    timestamp: new Date().toISOString()
  });
});

// Função para tentar a requisição com diferentes endpoints
async function tryDeepSeekRequest(message, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    const currentEndpoint = DEEPSEEK_API_ENDPOINTS[currentEndpointIndex];
    
    try {
      const response = await axios.post(
        currentEndpoint,
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

      return response.data;
    } catch (error) {
      console.error(`Tentativa ${i + 1} falhou no endpoint ${currentEndpoint}:`, error.message);
      
      // Alterna para o próximo endpoint
      currentEndpointIndex = (currentEndpointIndex + 1) % DEEPSEEK_API_ENDPOINTS.length;
      
      if (i === retries) throw error;
    }
  }
}

// Rota principal de chat - CORRIGIDA para evitar 404
app.post('/api/chat', async (req, res) => {
  console.log('Requisição POST recebida no /api/chat'); // Log de depuração
  
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'O campo "message" é obrigatório.' });
  }

  try {
    const responseData = await tryDeepSeekRequest(message);
    const reply = responseData.choices[0]?.message?.content;

    if (!reply) {
      throw new Error('Resposta inválida da API');
    }

    res.json({ reply });

  } catch (error) {
    console.error('Erro no DeepSeek:', error.response?.data || error.message);

    let statusCode = 500;
    let errorMessage = 'Erro ao processar sua mensagem';

    if (error.response?.status === 429) {
      statusCode = 429;
      errorMessage = 'Limite de requisições excedido (tente novamente mais tarde)';
    }

    res.status(statusCode).json({
      error: errorMessage,
      details: error.response?.data || error.message,
      current_endpoint: DEEPSEEK_API_ENDPOINTS[currentEndpointIndex],
      suggestion: 'Verifique se os endpoints da API DeepSeek ainda estão válidos'
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

// Inicia o servidor
app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
  console.log(`🔗 Endpoint POST: https://api-cv-production.up.railway.app/api/chat`);
  console.log('Endpoints DeepSeek configurados:', DEEPSEEK_API_ENDPOINTS);
});