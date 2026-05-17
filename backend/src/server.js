require('dotenv').config();

const express = require('express');
const cors = require('cors');

const specRouter = require('./routes/spec');
const jobRouter = require('./routes/jobs');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*'
}));

app.use(express.json());

app.get('/health', (_, res) => {
  res.json({
    status: 'ok',
    service: 'spec-to-ship-backend'
  });
});

app.use('/api/spec', specRouter);
app.use('/api/jobs', jobRouter);

app.listen(process.env.PORT || 8080, () => {
  console.log(`Backend running on port ${process.env.PORT || 8080}`);
});