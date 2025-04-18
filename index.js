import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateText } from '@ai-sdk/deepseek';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Verifica se a chave foi configurada
const apiKey = process.env.DEEPSEEK_API_KEY;
if (!apiKey) {
  throw new Error('A variável DEEPSEEK_API_KEY não está definida no .env ou no Railway!');
}

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    message: 'API rodando com DeepSeek!',
    status: 'online',
    provider: 'DeepSeek via SDK'
  });
});

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Mensagem ausente.' });
  }

  try {
    const response = await generateText({
      apiKey,
      model: 'deepseek-chat',
      messages: [
        { role: 'user', content: message }
      ],
      temperature: 0.7
    });

    res.json({ reply: response.text });
  } catch (error) {
    console.error('Erro no DeepSeek:', error);
    res.status(500).json({
      error: 'Erro ao processar sua mensagem.',
      details: error.message
    });
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
  console.log('Usando DeepSeek com SDK oficial e autenticação via API Key');
});
