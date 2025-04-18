import express from 'express';
import cors from 'cors';
import { streamText } from '@ai-sdk/deepseek';
import 'dotenv/config'; // para ler o .env local

const app = express();
const port = process.env.PORT || 3000;

const apiKey = process.env.DEEPSEEK_API_KEY;
if (!apiKey) {
  throw new Error('A variável DEEPSEEK_API_KEY não está definida.');
}

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ 
    status: 'online', 
    message: 'API rodando com DeepSeek usando chave API' 
  });
});

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Mensagem ausente' });
  }

  try {
    const result = await streamText({
      model: 'deepseek-chat',
      apiKey: apiKey,
      messages: [
        { role: 'user', content: message }
      ],
    });

    const fullText = await result.text();
    res.json({ reply: fullText });
  } catch (error) {
    console.error('Erro ao usar DeepSeek:', error);
    res.status(500).json({ 
      error: 'Erro ao processar sua mensagem',
      details: error.message 
    });
  }
});

app.listen(port, () => {
  console.log(`✅ Servidor rodando em http://localhost:${port}`);
});
