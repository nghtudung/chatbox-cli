const express = require('express');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const multer = require('multer');
const path = require('path');

const PORT = process.env.PORT || 4953;

app.use(express.static('public'));

const userMap = {}; // username -> socket.id

const upload = multer({
    dest: path.join(__dirname, 'public', 'uploads'),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

io.on('connection', (socket) => {
    console.log('🔌 New user joined');

    socket.on('join', (username) => {
        socket.username = username;
        userMap[username] = socket.id;
        console.log(`[LOG] New user: ${username}`);
        socket.broadcast.emit(
            'user-joined',
            `${username} has joined the chat.`
        );
    });

    socket.on('chat-message', (msg) => {
        io.emit('chat-message', {
            user: socket.username,
            message: msg,
            time: new Date().toISOString(),
        });
    });

    socket.on('leave', (name) => {
        socket.broadcast.emit('user-left', `${name} has left the chat.`);
        console.log(`[LOG] User: ${name} has left.`);
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

    socket.on('chat-image', (imageUrl) => {
        io.emit('chat-image', {
            user: socket.username,
            image: imageUrl,
            time: new Date().toISOString(),
        });
    });

    socket.on('chat-file', (fileData) => {
        io.emit('chat-file', {
            user: socket.username,
            ...fileData,
            time: new Date().toISOString(),
        });
    });

    //   socket.on('disconnect', () => {
    //     if (socket.username)
    //   io.emit('user-left', `${socket.username} đã rời phòng chat`);
    // delete userMap[socket.id];
    //   });
});

app.post('/upload-image', upload.single('image'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    // Đổi tên file để giữ lại phần mở rộng
    const ext = path.extname(req.file.originalname);
    const newPath = req.file.path + ext;
    require('fs').renameSync(req.file.path, newPath);
    const url = `/uploads/${path.basename(newPath)}`;
    res.json({ url });
});

app.post('/upload-file', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const ext = path.extname(req.file.originalname);
    const newPath = req.file.path + ext;
    require('fs').renameSync(req.file.path, newPath);
    const url = `/uploads/${path.basename(newPath)}`;
    res.json({ url, name: req.file.originalname });
});

http.listen(PORT, '0.0.0.0', () => {
    console.log(`🔥 Server is on http://localhost:${PORT}`);
});
