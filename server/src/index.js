require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
const sessionRoutes = require('./routes/session');
const roomRoutes = require('./routes/room');
const nicknameRoutes = require('./routes/nickname');
const adminRoutes = require('./routes/admin');
const registerSocketHandlers = require('./socket/handlers');
const { startRedisSubscriber } = require('./redis/subscriber');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/session', sessionRoutes);
app.use('/api/room', roomRoutes);
app.use('/api/nickname', nicknameRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

registerSocketHandlers(io);
startRedisSubscriber(io);

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
