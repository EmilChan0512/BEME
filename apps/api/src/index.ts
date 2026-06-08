import express from 'express';
import cors from 'cors';
import type { HealthResponse } from '@beme/shared';

const app = express();
const port = Number(process.env.PORT || 8787);

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  const data: HealthResponse = {
    name: 'beme-api',
    status: 'ok',
    timestamp: new Date().toISOString(),
  };
  res.json(data);
});

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
