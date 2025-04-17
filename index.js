import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

// Middleware para parsear JSON
app.use(express.json());

// Rota GET original
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'API rodando 🚀',
    env_test: process.env.TEST_VAR || 'Nenhuma variável de ambiente carregada'
  });
});

// Rota POST básica
app.post('/chat', (req, res) => {
  res.json({
    status: 'success',
    message: 'POST recebido!',
    body: req.body,
    env_key: process.env.OPENAI_API_KEY ? 'Chave presente' : 'Chave não configurada'
  });
});

// Rota 404 personalizada
app.use((req, res) => {
  res.status(404).json({
    error: 'Rota não encontrada',
    method: req.method,
    path: req.path
  });
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
  console.log('Variáveis de ambiente disponíveis:', process.env.OPENAI_API_KEY ? 'Sim' : 'Não');
});