import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const port = process.env.PORT || 3000;

// Configuração do DeepSeek
const DEEPSEEK_API_ENDPOINTS = [
  'https://api.deepseek.com/v1/chat/completions',
  'https://chat.deepseek.com/api/v1/chat'
];
let currentEndpointIndex = 0;

// Configuração robusta de CORS
const corsOptions = {
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Middleware para parsear JSON
app.use(express.json());

// Middleware para OPTIONS (pré-flight)
app.options('*', cors(corsOptions));

// Rota de status simplificada
app.get('/health', (_, res) => {
  res.json({
    status: 'online',
    provider: 'DeepSeek',
    timestamp: new Date().toISOString()
  });
});

// Função para chamada à API DeepSeek
async function callDeepSeek(message) {
  const endpoint = DEEPSEEK_API_ENDPOINTS[currentEndpointIndex];
  
  try {
    const response = await axios.post(endpoint, {
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: message }],
      temperature: 0.7,
      max_tokens: 500
    }, {
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    return response.data;
  } catch (error) {
    console.error(`Erro no endpoint ${endpoint}:`, error.message);
    // Alterna para o próximo endpoint
    currentEndpointIndex = (currentEndpointIndex + 1) % DEEPSEEK_API_ENDPOINTS.length;
    throw error;
  }
}

// Rota POST corrigida
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'O campo "message" é obrigatório' });
    }

    const result = await callDeepSeek(message);
    const reply = result.choices[0]?.message?.content;
    
    if (!reply) {
      throw new Error('Resposta inválida da API');
    }

    res.json({ reply });
  } catch (error) {
    console.error('Erro:', error.message);
    res.status(500).json({
      error: 'Erro ao processar sua mensagem',
      details: error.message
    });
  }
});

// Inicialização segura do servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
  console.log('Endpoints DeepSeek configurados:', DEEPSEEK_API_ENDPOINTS);
});