const socket = io();

const chat = document.getElementById('chat');
const messageInput = document.getElementById('message');
const sendBtn = document.getElementById('send');
const usernameInput = document.getElementById('username');
const setNameBtn = document.getElementById('setname');
const sendCodeBtn = document.getElementById('send-code');

let currentUser = null;

messageInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        if (e.shiftKey) {
            e.preventDefault();
            sendCodeBtn.click();
        } else {
            e.preventDefault();
            sendBtn.click();
        }
    }
});

setNameBtn.onclick = () => {
    const name = usernameInput.value.trim();
    if (name !== '') {
        socket.emit('join', name);
        currentUser = name;
        usernameInput.disabled = true;
        setNameBtn.disabled = true;
        messageInput.disabled = false;
        sendBtn.disabled = false;
        sendCodeBtn.disabled = false;
        messageInput.focus();
    }
};

sendBtn.onclick = () => {
    const msg = messageInput.value.trim();
    if (msg !== '') {
        if (msg.startsWith('/')) {
            handleCommand(msg);
        } else {
            socket.emit('chat-message', msg);
        }
        messageInput.value = '';
    }
};

sendCodeBtn.onclick = () => {
    const msg = messageInput.value;
    if (msg.trim() !== '') {
        socket.emit('chat-message', '```' + msg + '```');
        messageInput.value = '';
    }
};

function handleCommand(cmd) {
    const command = cmd.slice(1).toLowerCase();
    if (command === 'help') {
        addSystemMessage('Available commands:');
        addSystemMessage('/help - Show this help message');
        addSystemMessage('/clear - Clear the chat box');
        addSystemMessage('/about - About this chat');
        addSystemMessage('/show - Show online users');
        addSystemMessage(
            '/whisper arg1 arg2 - Send private message to someone'
        );
    } else if (command === 'clear') {
        chat.innerHTML = '';
    } else if (command === 'about') {
        addSystemMessage(
            'Chat Box v1.0.0, hẹ hẹ hẹ, from GieJack™ with love <3'
        );
    } else if (command === 'show') {
        socket.emit('show');
    } else if (command.startsWith('whisper ')) {
        const parts = cmd.split(' ');
        if (parts.length < 3) {
            addSystemMessage('❌ Usage: /whisper <username> <message>');
            return;
        }
        const toUser = parts[1];
        const msg = parts.slice(2).join(' ');
        socket.emit('whisper', { to: toUser, message: msg });
        addSystemMessage(`(you -> ${toUser}): ${msg}`);
    } else {
        addSystemMessage(`Unknown command: ${cmd}`);
    }
}

socket.on('chat-message', (data) => {
    const label = data.user === currentUser ? 'You' : data.user;
    addMessage(label, data.message);
});

socket.on('user-joined', (msg) => {
    addSystemMessage(msg);
});

socket.on('user-left', (msg) => {
    addSystemMessage(msg);
});

socket.on('whisper', (data) => {
    addSystemMessage(`(whisper from ${data.from}): ${data.message}`);
});

socket.on('whisper-error', (msg) => {
    addSystemMessage(`❌ ${msg}`);
});

socket.on('system message', (msg) => {
    addSystemMessage(msg);
});

window.addEventListener('beforeunload', () => {
    if (currentUser) {
        socket.emit('leave', currentUser);
    }
});

function addMessage(user, msg) {
    const div = document.createElement('div');
    div.classList.add('message');

    if (msg.startsWith('```') && msg.endsWith('```')) {
        const codeContent = msg.slice(3, -3);
        const pre = document.createElement('pre');
        const code = document.createElement('code');
        code.textContent = codeContent;
        pre.appendChild(code);
        pre.style.fontFamily = 'monospace';
        pre.style.background = '#f4f4f4';
        pre.style.padding = '10px';
        pre.style.borderRadius = '5px';
        pre.style.whiteSpace = 'pre-wrap';
        pre.style.position = 'relative';

        const copyBtn = document.createElement('button');
        copyBtn.textContent = 'Copy';
        copyBtn.style.position = 'absolute';
        copyBtn.style.top = '5px';
        copyBtn.style.right = '5px';
        copyBtn.style.padding = '2px 8px';
        copyBtn.style.fontSize = '12px';
        copyBtn.style.cursor = 'pointer';

        copyBtn.onclick = () => {
            navigator.clipboard
                .writeText(codeContent)
                .then(() => {
                    copyBtn.textContent = 'Copied!';
                    setTimeout(() => (copyBtn.textContent = 'Copy'), 1500);
                })
                .catch(() => {
                    alert('Copy failed!');
                });
        };

        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';
        wrapper.appendChild(pre);
        wrapper.appendChild(copyBtn);

        div.innerHTML = `<span class="user">${user}:</span>`;
        div.appendChild(wrapper);
    } else {
        div.innerHTML = `<span class="user">${user}:</span> ${escapeHtml(msg)}`;
    }

    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

function addSystemMessage(msg) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.style.fontStyle = 'italic';
    div.style.color = 'gray';
    div.textContent = msg;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;',
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}
