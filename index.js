import express from 'express';
import dotenv from 'dotenv';
import OpenAI from 'openai';

// Carrega as variáveis de ambiente do arquivo .env
dotenv.config();

// Verifica se a OPENAI_API_KEY existe
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ Erro: OPENAI_API_KEY não encontrada no ambiente!');
  console.log('ℹ️ Certifique-se de:');
  console.log('1. Adicionar a variável no Railway (Settings > Variables)');
  console.log('2. O nome da variável está exatamente como "OPENAI_API_KEY"');
  console.log('3. Reiniciar o serviço após adicionar a variável');
  process.exit(1); // Encerra o servidor se a chave não estiver configurada
}

// Inicializa o Express e a OpenAI
const app = express();
const port = process.env.PORT || 3000;
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middleware para parsear JSON
app.use(express.json());

// Rota de teste (GET)
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'API OpenAI funcionando 🚀',
    openai_key: process.env.OPENAI_API_KEY ? '✅ Configurada' : '❌ Não configurada',
  });
});

// Rota principal (POST /chat)
app.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;

    // Validação da requisição
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: 'O campo "messages" é obrigatório e deve ser um array.',
      });
    }

    // Chamada para a OpenAI
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages,
      temperature: 0.7,
    });

    // Retorna a resposta da OpenAI
    res.json({
      status: 'success',
      response: response.choices[0]?.message,
    });

  } catch (error) {
    console.error('Erro na chamada da OpenAI:', error);

    // Tratamento de erros
    res.status(500).json({
      status: 'error',
      message: error.message || 'Erro interno no servidor.',
    });
  }
});

// Rota para lidar com rotas não encontradas
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Rota não encontrada.',
  });
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`🚀 Servidor rodando na porta ${port}`);
  console.log(`🔗 Teste a rota GET em: http://localhost:${port}`);
});