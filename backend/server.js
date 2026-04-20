require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const { connectRedis } = require('./config/redis');
const { verifySmtpConnection } = require('./utils/email');
const jwt = require('jsonwebtoken');
const { Server } = require('socket.io');
const ChatConversation = require('./models/ChatConversation');
const ChatMessage = require('./models/ChatMessage');

connectDB();
connectRedis().catch((err) => {
  console.error('Redis connection failed:', err.message);
});

const app = express();
const server = http.createServer(app);

const corsOptions = {
  origin: process.env.FRONTEND_URL || true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' },
});

app.use(limiter);

app.get('/', (req, res) => {
  res.json({ message: 'Ecommerce API is running' });
});
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/user', require('./routes/user.routes'));
app.use('/api/seller', require('./routes/seller.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/chat', require('./routes/chat.routes'));

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.error('[error]', err.stack || err.message || err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

verifySmtpConnection();

const port = process.env.PORT || 5000;

const io = new Server(server, {
  cors: corsOptions,
});

io.use((socket, next) => {
  try {
    const raw = socket.handshake.auth?.token || socket.handshake.headers?.authorization || '';
    const token = String(raw).replace('Bearer ', '').trim();
    if (!token) return next(new Error('Unauthorized'));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    return next();
  } catch (err) {
    return next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  const userId = String(socket.user?.id || '');
  if (userId) {
    socket.join(`user:${userId}`);
  }

  socket.on('chat:join', async ({ conversationId }) => {
    if (!conversationId) return;
    const convo = await ChatConversation.findById(conversationId).select('buyer seller');
    if (!convo) return;

    const isMember = String(convo.buyer) === userId || String(convo.seller) === userId;
    if (!isMember) return;

    socket.join(`convo:${conversationId}`);
  });

  socket.on('chat:send', async ({ conversationId, text }) => {
    try {
      const messageText = String(text || '').trim();
      if (!conversationId || !messageText) return;

      const convo = await ChatConversation.findById(conversationId);
      if (!convo) return;

      const isMember = String(convo.buyer) === userId || String(convo.seller) === userId;
      if (!isMember) return;

      const message = await ChatMessage.create({
        conversation: conversationId,
        sender: userId,
        text: messageText,
        readBy: [userId],
      });

      await ChatConversation.findByIdAndUpdate(conversationId, {
        $set: { lastMessage: messageText, lastMessageAt: new Date() },
      });

      const populated = await ChatMessage.findById(message._id).populate('sender', 'name email role');
      io.to(`convo:${conversationId}`).emit('chat:message', { conversationId, message: populated });
      io.to(`user:${String(convo.buyer)}`).emit('chat:conversation:update', { conversationId });
      io.to(`user:${String(convo.seller)}`).emit('chat:conversation:update', { conversationId });
    } catch (err) {
      console.error('[socket] chat:send error:', err.message);
    }
  });
});

server.listen(port, () => console.log(`Server running on port ${port}`));