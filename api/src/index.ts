import express from 'express';

const app = express();
const port = Number(process.env.PORT ?? 3000);

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'peptrace-api' });
});

// API routes will be added here by the AI Software Factory.

app.listen(port, () => {
  console.log(`peptrace-api listening on port ${port}`);
});
