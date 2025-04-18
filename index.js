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

// Rota POST corrigida (atenção ao caminho /api/chat)
app.post('/api/chat', async (req, res) => {
  console.log('Recebida requisição POST em /api/chat'); // Log importante
  
  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'O campo "message" é obrigatório' });
    }

    // Simulação de resposta - REMOVA quando for usar a API real
    const mockResponse = {
      reply: "Esta é uma resposta simulada. Configure a integração com DeepSeek depois.",
      original_message: message
    };

    res.json(mockResponse);

    /* 
    // Código para usar com a API DeepSeek (descomente depois)
    const response = await axios.post('https://api.deepseek.com/v1/chat/completions', {
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: message }]
    }, {
      headers: { 'Content-Type': 'application/json' }
    });

    res.json(response.data.choices[0].message);
    */

  } catch (error) {
    console.error('Erro no POST /api/chat:', error);
    res.status(500).json({ 
      error: 'Erro interno',
      details: error.message 
    });
  }
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`✅ Servidor rodando na porta ${port}`);
  console.log(`🔗 Health Check: https://api-cv-production.up.railway.app/health`);
  console.log(`✉️  Endpoint POST: https://api-cv-production.up.railway.app/api/chat`);
});