const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let io = null;

const SOCKET_ORIGINS = [
  process.env.CLIENT_URL,
  process.env.ADMIN_URL,
  'http://localhost:5173',
  'http://localhost:5174',
].filter(Boolean);

function extractToken(socket) {
  const auth = socket.handshake.auth || {};
  const header = socket.handshake.headers?.authorization || '';
  const query = socket.handshake.query || {};
  if (auth.token) return String(auth.token).replace(/^Bearer\s+/i, '');
  if (query.token) return String(query.token).replace(/^Bearer\s+/i, '');
  if (header.startsWith('Bearer ')) return header.slice(7);
  return '';
}

function adminRoom() {
  return 'admin-room';
}

function dealerRoom(dealerId) {
  return `dealer-${dealerId}`;
}

function userRoom(userId) {
  return `user-${userId}`;
}

function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: SOCKET_ORIGINS, credentials: true },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  io.use(async (socket, next) => {
    try {
      const token = extractToken(socket);
      if (!token) return next(new Error('Not authorized, no token'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('_id role isActive name dealershipName');
      if (!user || user.isActive === false) return next(new Error('Not authorized'));
      socket.user = user;
      next();
    } catch {
      next(new Error('Not authorized, token invalid'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.user;
    const uid = String(user._id);
    socket.join(userRoom(uid));
    if (user.role === 'admin' || user.role === 'super_admin') {
      socket.join(adminRoom());
    }
    if (user.role === 'dealer') {
      socket.join(dealerRoom(uid));
    }
    socket.emit('connected', { userId: uid, role: user.role });
  });

  return io;
}

function getIO() {
  return io;
}

function emitToRooms(rooms, event, payload) {
  if (!io) return;
  const list = Array.isArray(rooms) ? rooms : [rooms];
  list.filter(Boolean).forEach((room) => io.to(room).emit(event, payload));
}

function emitToUsers(userIds, event, payload) {
  if (!io) return;
  (userIds || []).filter(Boolean).forEach((id) => io.to(userRoom(id)).emit(event, payload));
}

module.exports = {
  initSocket,
  getIO,
  emitToRooms,
  emitToUsers,
  adminRoom,
  dealerRoom,
  userRoom,
};
