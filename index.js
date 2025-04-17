import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

// Middlewares ESSENCIAIS
app.use(express.json()); // Para receber JSON
app.use(express.urlencoded({ extended: true })); // Para formulários

// Rota GET de teste
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'API rodando!',
    endpoints: {
      GET: '/',
      POST: '/api/chat' // Mudei para um path mais claro
    }
  });
});

// Rota POST corrigida
app.post('/api/chat', (req, res) => { // Path mais explícito
  console.log('Corpo recebido:', req.body); // Para debug
  res.json({
    status: 'success',
    received: req.body
  });
});

// Rota para 404 personalizado
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Rota não existe',
    tried: {
      method: req.method,
      path: req.path
    }
  });
});

app.listen(port, () => {
  console.log(`✅ Servidor rodando em http://localhost:${port}`);
});