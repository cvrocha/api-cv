import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Configuração do CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());

// Verifica se a chave API está configurada
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
if (!DEEPSEEK_API_KEY) {
  console.error('❌ Erro: DEEPSEEK_API_KEY não está definida');
  process.exit(1);
}

// Rota de health check
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    message: 'API funcionando',
    deepseek_status: DEEPSEEK_API_KEY ? 'Configurada' : 'Não configurada'
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

    // Chamada à API DeepSeek com autenticação
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
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
        },
        timeout: 10000
      }
    );

    // Validação da resposta
    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Resposta da API em formato inesperado');
    }

    res.json({ reply: response.data.choices[0].message.content });

  } catch (error) {
    console.error('Erro na API DeepSeek:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });

    const statusCode = error.response?.status || 500;
    const errorMessage = error.response?.data?.error?.message || 'Erro ao processar sua mensagem';

    res.status(statusCode).json({
      error: errorMessage,
      details: {
        type: error.name,
        status: statusCode,
        message: error.message
      }
    });
  }
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
  console.log(`🔗 Health Check: http://localhost:${port}/health`);
});