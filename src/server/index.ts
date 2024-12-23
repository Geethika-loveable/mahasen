import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import webhookRouter from './webhook';

const app = express();
const port = process.env.VITE_SERVER_PORT || 8000;

app.use(cors());
app.use(express.json());
app.use('/webhook', webhookRouter);

app.listen(port, () => {
  console.log(`WhatsApp webhook server running on port ${port}`);
});
