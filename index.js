import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Carrega variáveis do .env
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Configuração melhorada
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS']
}));

app.use(express.json());

// Middleware para log de variáveis
app.use((req, res, next) => {
  console.log('Variáveis carregadas:', {
    PORT: process.env.PORT,
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY ? '***' + process.env.DEEPSEEK_API_KEY.slice(-4) : 'Não configurada'
  });
  next();
});


// Rota de status
app.get('/health', (req, res) => {
  res.json({
    status: 'online',
    domain: 'api-cv-production.up.railway.app',
    features: {
      local_fallback: true,
      deepseek_integration: !!process.env.DEEPSEEK_API_KEY
    },
    timestamp: new Date().toISOString()
  });
});

// Middleware de log para todas as requisições
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Rota principal com fallback
app.post('/api/chat', async (req, res) => {
  try {
    const { message } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ 
        error: 'Formato inválido',
        details: 'O campo "message" deve ser uma string não vazia'
      });
    }

    console.log(`Recebida mensagem: "${message}"`);

    // Tenta primeiro a API do DeepSeek (se tiver chave)
    if (process.env.DEEPSEEK_API_KEY) {
      console.log('Chave da API DeepSeek detectada, tentando conexão...');
      
      try {
        const apiUrl = 'https://api.deepseek.com/v1/chat/completions';
        console.log(`Enviando requisição para: ${apiUrl}`);
        
        const requestBody = {
          model: 'deepseek-chat',
          messages: [{ role: 'user', content: message }],
          temperature: 0.7
        };

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`
          },
          body: JSON.stringify(requestBody)
        });

        console.log(`Status da resposta: ${response.status}`);
        
        if (!response.ok) {
          const errorBody = await response.text();
          console.error('Erro na resposta da API:', {
            status: response.status,
            body: errorBody
          });
          throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();
        console.log('Resposta da API recebida com sucesso');
        
        return res.json({ 
          reply: data.choices[0].message.content,
          source: 'deepseek-api',
          model: data.model,
          usage: data.usage
        });

      } catch (apiError) {
        console.error('Falha detalhada na API DeepSeek:', {
          message: apiError.message,
          stack: apiError.stack,
          config: {
            hasKey: !!process.env.DEEPSEEK_API_KEY,
            keyPresent: process.env.DEEPSEEK_API_KEY ? '***' + process.env.DEEPSEEK_API_KEY.slice(-4) : 'não'
          }
        });
      }
    } else {
      console.log('Chave da API DeepSeek não configurada - usando fallback local');
    }

    // Fallback para respostas locais
    const lowerMessage = message.toLowerCase();
    const reply = LOCAL_RESPONSES[lowerMessage] || LOCAL_RESPONSES['default'];
    
    res.json({
      reply,
      source: 'local-fallback',
      info: process.env.DEEPSEEK_API_KEY 
        ? 'Serviço de IA temporariamente indisponível' 
        : 'Integração com DeepSeek não configurada'
    });

  } catch (error) {
    console.error('Erro geral no endpoint /api/chat:', {
      error: error.message,
      stack: error.stack,
      requestBody: req.body
    });
    
    res.status(500).json({
      error: 'Erro interno',
      details: process.env.NODE_ENV === 'development' ? error.message : null,
      support: 'api-cv-production.up.railway.app/health'
    });
  }
});

// Rota para verificar variáveis de ambiente (apenas para desenvolvimento)
app.get('/env-check', (req, res) => {
  if (process.env.NODE_ENV !== 'production') {
    res.json({
      deepseek_key: process.env.DEEPSEEK_API_KEY ? '***' + process.env.DEEPSEEK_API_KEY.slice(-4) : 'não configurada',
      node_env: process.env.NODE_ENV,
      port: process.env.PORT
    });
  } else {
    res.status(403).json({ error: 'Não disponível em produção' });
  }
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`✅ Servidor rodando na porta ${port}`);
  console.log(`🔗 Acesse: http://localhost:${port}/health`);
  console.log('📌 Variáveis carregadas:', {
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY ? 'Configurada' : 'Não configurada'
  });
});