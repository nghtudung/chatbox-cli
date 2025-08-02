const readline = require('readline');
const io = require('socket.io-client');
const chalk = require('chalk');
const PORT = 4953;

// Kết nối tới server qua IP LAN hoặc localhost
const socket = io(`http://localhost:${PORT}`);

// Gán màu cho mỗi user
function getColorForUser(username) {
    const colors = [
        chalk.red,
        chalk.green,
        chalk.yellow,
        chalk.blue,
        chalk.magenta,
        chalk.cyan,
        chalk.white,
    ];
    let hash = 0;
    for (let i = 0; i < username.length; i++) hash += username.charCodeAt(i);
    return colors[hash % colors.length];
}

// Tạo input CMD
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

rl.question('Nhập tên của bạn: ', (username) => {
    socket.emit('join', username);

    rl.setPrompt('');
    rl.prompt();

    rl.on('line', (line) => {
        socket.emit('chat-message', `${line}`);
        console.log(chalk.gray(`Bạn: ${line}`));
        rl.prompt();
    });

    socket.on('chat', (msg) => {
        if (msg.startsWith(username + ':')) return;

        const [sender, ...rest] = msg.split(':');
        const color = getColorForUser(sender.trim());
        const content = rest.join(':').trim();

        console.log(`${color(sender.trim())}: ${content}`);
        rl.prompt();
    });
});
