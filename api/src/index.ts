import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';

const app = express();
const port = Number(process.env.PORT ?? 3000);
const JWT_SECRET = process.env.JWT_SECRET ?? 'peptrace-factory-secret';

app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'peptrace-api' });
});

app.post('/auth/login', (req, res) => {
  const { email } = req.body;
  if (!email || typeof email !== 'string') {
    res.status(400).json({ error: 'Email is required' });
    return;
  }
  const token = jwt.sign({ email, name: email.split('@')[0] }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token });
});

app.get('/auth/me', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const token = auth.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { email: string; name: string };
    res.json({ id: payload.email, email: payload.email, name: payload.name });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

app.listen(port, () => {
  console.log(`peptrace-api listening on port ${port}`);
});
