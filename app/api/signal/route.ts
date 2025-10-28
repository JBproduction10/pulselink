import { createServer } from 'http';
import { Server, Socket } from 'socket.io';

const httpServer = createServer();
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const users = new Map();

io.on('connection', (socket: Socket) => {
  console.log('User connected:', socket.id);

  socket.on('register', (data) => {
    users.set(socket.id, {
      userId: data.userId,
      userName: data.userName,
      socketId: socket.id
    });

    console.log('User registered:', data.userName);

    // Notify this user about existing peers
    const peers = Array.from(users.values())
      .filter(u => u.socketId !== socket.id)
      .map(u => ({ userId: u.userId, userName: u.userName }));

    socket.emit('peers-list', peers);

    // Notify all other users about this new peer
    socket.broadcast.emit('peer-discovered', {
      userId: data.userId,
      userName: data.userName
    });
  });

  socket.on('signal', (signal) => {
    // Forward signaling data to the target peer
    const targetUser = Array.from(users.values())
      .find(u => u.userId === signal.to);

    if (targetUser) {
      io.to(targetUser.socketId).emit('signal', signal);
    }
  });

  socket.on('get-peers', () => {
    const peers = Array.from(users.values())
      .filter(u => u.socketId !== socket.id)
      .map(u => ({ userId: u.userId, userName: u.userName }));

    socket.emit('peers-list', peers);
  });

  socket.on('disconnect', () => {
    const user = users.get(socket.id);
    if (user) {
      console.log('User disconnected:', user.userName);
      users.delete(socket.id);

      // Notify others about disconnection
      socket.broadcast.emit('peer-disconnected', {
        userId: user.userId
      });
    }
  });
});

// const PORT = process.env.PORT || 3001;
// httpServer.listen(PORT, () => {
//   console.log(`Signaling server running on port ${PORT}`);
// });
