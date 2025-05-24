const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 4953;

app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('🔌 Một user đã kết nối');

  socket.on('join', (username) => {
    socket.username = username;
    console.log(`[LOG] Người dùng mới: ${username}`);
    socket.broadcast.emit('user-joined', `${username} đã vào phòng chat`);
  });

  socket.on('chat-message', (msg) => {
    // Gửi cho tất cả, kể cả người gửi
    io.emit('chat-message', { user: socket.username, message: msg });
  });

  socket.on('leave', name => {
        socket.broadcast.emit('user-left', `${name} đã rời khỏi phòng chat.`);
        console.log(`[LOG] Người dùng: ${name} vừa rời`);
    });

  socket.on('disconnect', () => {
    if (socket.username)
      io.emit('user-left', `${socket.username} đã rời phòng chat`);
  });
});

http.listen(PORT, () => {
  console.log(`🔥 Server chạy tại http://localhost:${PORT}`);
});
