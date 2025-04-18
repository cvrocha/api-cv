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

// Middlewares
app.use(cors());
app.use(express.json());

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
          headers: { 'Content-Type': 'application/json' },
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

// Rota principal de chat
app.post('/api/chat', async (req, res) => {
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
      current_endpoint: DEEPSEEK_API_ENDPOINTS[currentEndpointIndex]
    });
  }
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
  console.log(`🔗 Teste no Postman: POST http://localhost:${port}/api/chat`);
  console.log('Endpoints configurados:', DEEPSEEK_API_ENDPOINTS);
});