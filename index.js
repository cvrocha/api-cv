import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
const port = process.env.PORT || 3000;

// Configuração do DeepSeek (sem token necessário)
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions';

// Middlewares
app.use(cors());
app.use(express.json());

// Rota de status (teste de saúde)
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    provider: 'DeepSeek (gratuito)',
    timestamp: new Date().toISOString()
  });
});

// Rota principal de chat
app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'O campo "message" é obrigatório.' });
  }

  try {
    const response = await axios.post(
      DEEPSEEK_API_URL,
      {
        model: 'deepseek-chat', // Modelo gratuito
        messages: [{ role: 'user', content: message }],
        temperature: 0.7,
        max_tokens: 500
      },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000 // 10 segundos de timeout
      }
    );

    // Extrai a resposta
    const reply = response.data.choices[0]?.message?.content;
    
    if (!reply) {
      throw new Error('Resposta inválida da API');
    }

    res.json({ reply });

  } catch (error) {
    console.error('Erro no DeepSeek:', error.response?.data || error.message);
    
    // Tratamento de erros específicos
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
  console.log(`🚀 Servidor rodando na porta ${port}`);
  console.log(`🔗 Teste no Postman: POST http://localhost:${port}/api/chat`);
});