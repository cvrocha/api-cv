import express from 'express';
import OpenAI from 'openai';

const app = express();
const port = process.env.PORT || 3000;

// Método mais robusto para obter a chave
function getOpenAIKey() {
  // Tenta obter da variável de ambiente
  const envKey = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY;
  
  // Verifica se a chave parece válida
  if (envKey && envKey.startsWith('sk-')) {
    return envKey;
  }
  
  return null;
}

const openaiKey = getOpenAIKey();

if (!openaiKey) {
  console.error(`
  ===========================================
  ERRO CRÍTICO: Chave da OpenAI não encontrada
  ===========================================
  
  Possíveis causas:
  1. Variável não definida no Railway
  2. Nome incorreto da variável (deve ser OPENAI_API_KEY)
  3. Chave não começa com 'sk-'
  4. Serviço não foi reiniciado após configurar a variável

  O que fazer:
  1. Acesse Railway > Settings > Variables
  2. Adicione OPENAI_API_KEY com sua chave válida
  3. Reinicie o serviço (Deployments > Restart)
  4. Verifique os logs para ver se a chave foi carregada

  Dica técnica: ${process.env.OPENAI_API_KEY ? 'Variável existe mas é inválida' : 'Variável não existe'}
  `);
  process.exit(1);
}

const openai = new OpenAI({ apiKey: openaiKey });

app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'API operacional',
    openai_configured: !!openaiKey
  });
});

app.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body;
    
    if (!messages) {
      return res.status(400).json({ error: 'Messages are required' });
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages
    });

    res.json(response.choices[0].message);
  } catch (error) {
    console.error('OpenAI Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`OpenAI Key: ${openaiKey ? 'Configured' : 'Missing'}`);
});