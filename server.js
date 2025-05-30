const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);

const PORT = process.env.PORT || 4953;

app.use(express.static('public'));

const userMap = {}; // username -> socket.id

io.on('connection', (socket) => {
    console.log('🔌 Một user đã kết nối');

    socket.on('join', (username) => {
        socket.username = username;
        userMap[username] = socket.id;
        console.log(`[LOG] Người dùng mới: ${username}`);
        socket.broadcast.emit('user-joined', `${username} đã vào phòng chat`);
    });

    socket.on('chat-message', (msg) => {
        // Gửi cho tất cả, kể cả người gửi
        io.emit('chat-message', { user: socket.username, message: msg });
    });

    socket.on('leave', (name) => {
        socket.broadcast.emit('user-left', `${name} đã rời khỏi phòng chat.`);
        console.log(`[LOG] Người dùng: ${name} vừa rời`);
        delete userMap[name];
    });

    socket.on('whisper', ({ to, message }) => {
        const targetId = userMap[to];
        if (targetId) {
            io.to(targetId).emit('whisper', { from: socket.username, message });
        } else {
            socket.emit('whisper-error', `User "${to}" not found.`);
        }
    });

    socket.on('show', () => {
        const onlineUsers = Object.keys(userMap); // Lấy danh sách tên người dùng
        socket.emit(
            'system message',
            `🧑‍💻 Online users: ${onlineUsers.join(', ') || 'none'}`
        );
    });

    //   socket.on('disconnect', () => {
    //     if (socket.username)
    //   io.emit('user-left', `${socket.username} đã rời phòng chat`);
    // delete userMap[socket.id];
    //   });
});

http.listen(PORT, '0.0.0.0', () => {
    console.log(`🔥 Server chạy tại http://localhost:${PORT}`);
});
