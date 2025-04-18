import express from 'express';
import cors from 'cors'; // 👈 Importando o CORS

const app = express();
const port = process.env.PORT || 3000;

// 🛡️ Middlewares
app.use(cors()); // 👈 Aplicando o CORS globalmente
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 🔗 Rota GET de teste
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'API rodando!',
    endpoints: {
      GET: '/',
      POST: '/api/chat'
    }
  });
});

// 🤖 Rota POST do chat
app.post('/api/chat', (req, res) => {
  console.log('Corpo recebido:', req.body);
  res.json({
    status: 'success',
    received: req.body
  });
});

// ❌ Rota 404 personalizada
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Rota não existe',
    tried: {
      method: req.method,
      path: req.path
    }
  });
});

// 🚀 Inicialização
app.listen(port, () => {
  console.log(`✅ Servidor rodando em http://localhost:${port}`);
});
