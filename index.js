import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const port = process.env.PORT || 3000;

// Endpoints com fallback
const DEEPSEEK_API_ENDPOINTS = [
  'https://api.deepseek.com/v1/chat/completions', // Requer API Key
  'https://chat.deepseek.com/api/v1/chat'         // Endpoint público (sem key)
];
let currentEndpointIndex = 0;

// Configuração do CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS']
}));

app.use(express.json());

// Função para selecionar o endpoint apropriado
function getApiConfig() {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim();
  const endpoint = DEEPSEEK_API_ENDPOINTS[currentEndpointIndex];
  
  return {
    url: endpoint,
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey && endpoint.includes('api.deepseek.com') && { 
        'Authorization': `Bearer ${apiKey}` 
      })
    }
  };
}

// Rota de health check
app.get('/health', (req, res) => {
  const apiConfig = getApiConfig();
  res.json({
    status: 'online',
    current_endpoint: apiConfig.url,
    auth_required: apiConfig.headers.Authorization ? 'yes' : 'no'
  });
});

// Rota principal de chat
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'O campo "message" é obrigatório' });
    }

    const { url, headers } = getApiConfig();
    
    const response = await axios.post(
      url,
      {
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: message }],
        temperature: 0.7
      },
      {
        headers,
        timeout: 10000
      }
    );

    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Resposta inválida da API');
    }

    res.json({ reply: response.data.choices[0].message.content });

  } catch (error) {
    console.error('Erro no endpoint', DEEPSEEK_API_ENDPOINTS[currentEndpointIndex], error.message);
    
    // Alterna para o próximo endpoint
    currentEndpointIndex = (currentEndpointIndex + 1) % DEEPSEEK_API_ENDPOINTS.length;
    
    // Se tentou todos endpoints sem sucesso
    if (currentEndpointIndex === 0) {
      return res.status(500).json({
        error: 'Todos endpoints falharam',
        details: error.message,
        suggestion: 'Tente novamente mais tarde ou configure a DEEPSEEK_API_KEY'
      });
    }
    
    // Tenta novamente com o próximo endpoint
    setTimeout(() => {
      axios.post('/api/chat', req.body)
        .then(response => res.json(response.data))
        .catch(err => res.status(500).json({ error: err.message }));
    }, 1000);
  }
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
  console.log('🔍 Endpoints configurados:');
  DEEPSEEK_API_ENDPOINTS.forEach((endpoint, i) => {
    console.log(`${i + 1}. ${endpoint} ${i === 0 ? '(requer chave)' : '(público)'}`);
  });
});