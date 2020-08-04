import express from 'express';

const app = express();
const PORT = 5000;

app.get('/', (req, res) => {
  res.send('');
});

app.listen(PORT, () => {
  console.log(`🚀🚀 Gyrograph Node Server listening at http://localhost:${PORT} 🚀🚀`);
});
