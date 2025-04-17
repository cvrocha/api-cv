import express from 'express';
import dotenv from 'dotenv';
import OpenAI from 'openai';

// ==============================================
// 1. CONFIGURAÇÃO INICIAL
// ==============================================
dotenv.config();
const app = express();
const port = process.env.PORT || 3000;

// ==============================================
// 2. VERIFICAÇÃO DA CHAVE OPENAI (CRÍTICO!)
// ==============================================
const OPENAI_API_KEY = process.env.OPENAI_API_KEY?.trim();

if (!OPENAI_API_KEY || !OPENAI_API_KEY.startsWith('sk-')) {
  console.error(`
  ❌❌❌ ERRO FATAL ❌❌❌
  OPENAI_API_KEY não configurada ou inválida!
  
  ➡️ O QUE VERIFICAR:
  1. No painel do Railway:
     - Vá em Settings > Variables
     - Adicione OPENAI_API_KEY (exatamente esse nome)
     - Valor: sua chave da OpenAI (começa com 'sk-')
  2. Reinicie o serviço (Deployments > Restart)
  
  🔍 Chave detectada: ${OPENAI_API_KEY || 'NÃO ENCONTRADA'}
  `);
  process.exit(1);
}

// ==============================================
// 3. INICIALIZAÇÃO DO OPENAI COM FALLBACK
// ==============================================
const openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
});

// ==============================================
// 4. MIDDLEWARES
// ==============================================
app.use(express.json());

// ==============================================
// 5. ROTAS
// ==============================================

// Rota de saúde (GET)
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'API operacional ✅',
    environment: process.env.NODE_ENV || 'development',
    openai_key: OPENAI_API_KEY ? '✅ Configurada' : '❌ Faltando'
  });
});

// Rota principal de chat (POST)
app.post('/chat', async (req, res) => {
  try {
    // Validação do corpo da requisição
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({
        error: 'O campo "messages" é obrigatório e deve ser um array',
        example: {
          messages: [
            { role: "user", content: "Sua mensagem aqui" }
          ]
        }
      });
    }

    // Chamada à API da OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      temperature: 0.7,
      max_tokens: 500
    });

    // Resposta formatada
    res.json({
      status: 'success',
      response: completion.choices[0]?.message
    });

  } catch (error) {
    console.error('Erro na OpenAI:', error);
    
    // Tratamento de erros específicos
    const statusCode = error.status || 500;
    const errorMessage = error.message || 'Erro interno no servidor';
    
    res.status(statusCode).json({
      status: 'error',
      message: errorMessage,
      ...(process.env.NODE_ENV !== 'production' && {
        stack: error.stack,
        fullError: JSON.stringify(error, null, 2)
      })
    });
  }
});

// ==============================================
// 6. INICIALIZAÇÃO DO SERVIDOR
// ==============================================
app.listen(port, () => {
  console.log(`
  🚀 Servidor rodando na porta ${port}
  ➡️ Teste as rotas:
  - GET  http://localhost:${port}
  - POST http://localhost:${port}/chat
  `);
});