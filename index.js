import express from 'express';
import dotenv from 'dotenv';
import OpenAI from 'openai';

// Configuração do dotenv para carregar variáveis de ambiente
dotenv.config();

// Verificação da chave da API antes de iniciar o servidor
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ Erro Crítico: OPENAI_API_KEY não encontrada nas variáveis de ambiente');
  console.error('ℹ️ Certifique-se de que:');
  console.error('1. Você criou a variável no painel do Railway');
  console.error('2. O nome da variável está exatamente como "OPENAI_API_KEY"');
  console.error('3. Você reiniciou o serviço após adicionar a variável');
  process.exit(1);
}

// Inicialização do Express e OpenAI
const app = express();
const port = process.env.PORT || 3000;
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Middlewares
app.use(express.json()); // Para parsear JSON

// Rota de saúde
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'API operacional',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rota principal de chat
app.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    // Validação da requisição
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: 'O campo "messages" é obrigatório e deve ser um array'
      });
    }

    // Chamada à API da OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.7
    });

    // Resposta formatada
    res.json({
      status: 'success',
      response: completion.choices[0]?.message
    });

  } catch (error) {
    console.error('Erro na chamada da OpenAI:', error);
    
    // Tratamento de erros específicos
    let statusCode = 500;
    let errorMessage = 'Erro interno no servidor';
    
    if (error instanceof OpenAI.APIError) {
      statusCode = error.status || 500;
      errorMessage = error.message;
    }
    
    res.status(statusCode).json({
      status: 'error',
      message: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// Middleware para rotas não encontradas
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Rota não encontrada'
  });
});

// Inicialização do servidor
app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
  console.log(`🔑 OpenAI API Key: ${process.env.OPENAI_API_KEY ? '✔️ Configurada' : '❌ Não configurada'}`);
});