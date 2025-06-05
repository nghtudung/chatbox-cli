const socket = io();

const chat = document.getElementById('chat');
const messageInput = document.getElementById('message');
const sendBtn = document.getElementById('send');
const usernameInput = document.getElementById('username');
const setNameBtn = document.getElementById('setname');
const sendCodeBtn = document.getElementById('send-code');
const imageInput = document.getElementById('image-input');
const sendImageBtn = document.getElementById('send-image');
const imagePreview = document.getElementById('image-preview');
const toggleDarkBtn = document.getElementById('toggle-dark');

let currentUser = null;
let pendingImageData = null;

// Handle Enter/Shift+Enter for sending messages/code
messageInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        if (e.ctrlKey) {
            e.preventDefault();
            sendCodeBtn.click();
        } else if (e.altKey) {
            e.preventDefault();
            sendImageBtn.click();
        } else if (e.shiftKey) {
            // Allow new line (default behavior)
        } else {
            e.preventDefault();
            sendBtn.click();
        }
    }
});

// Set nickname and enable controls
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
        sendImageBtn.disabled = false;
        messageInput.focus();
    }
};

// Send text message
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

// Send code message
sendCodeBtn.onclick = () => {
    const msg = messageInput.value;
    if (msg.trim() !== '') {
        socket.emit('chat-message', '```' + msg + '```');
        messageInput.value = '';
    }
};

// Command handler
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
            'Chat Box v1.1.0, hẹ hẹ hẹ, from GieJack™ with love <3'
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

// Helper to format time as HH:mm
function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Socket event handlers
socket.on('chat-message', (data) => {
    const label = data.user === currentUser ? 'You' : data.user;
    addMessage(label, data.message, data.time);
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

socket.on('chat-image', (data) => {
    const label = data.user === currentUser ? 'You' : data.user;
    addImageMessage(label, data.image, data.time);
});

// Leave event on window close
window.addEventListener('beforeunload', () => {
    if (currentUser) {
        socket.emit('leave', currentUser);
    }
});

// Add text/code message to chat
function addMessage(user, msg, time) {
    const div = document.createElement('div');
    div.classList.add('message');

    let timeHtml = '';
    if (time) {
        timeHtml = `<span class="msg-time">${formatTime(time)}</span>`;
    }

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
        div.innerHTML += timeHtml;
    } else {
        // Escape HTML and preserve new lines
        const safeMsg = escapeHtml(msg).replace(/\n/g, '<br>');
        div.innerHTML = `<span class="user">${user}:</span> ${safeMsg}${timeHtml}`;
    }

    // Style time to the right
    if (time) {
        div.querySelector('.msg-time').style.float = 'right';
        div.querySelector('.msg-time').style.color = '#888';
        div.querySelector('.msg-time').style.fontSize = '12px';
        div.querySelector('.msg-time').style.marginLeft = '8px';
    }

    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

// Add system message to chat
function addSystemMessage(msg) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.style.fontStyle = 'italic';
    div.style.color = 'gray';
    div.textContent = msg;
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

// Escape HTML
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

// --- IMAGE PREVIEW AND SEND ---

// Show image preview
function showImagePreview(dataUrl) {
    pendingImageData = dataUrl;
    imagePreview.innerHTML = `
        <img src="${dataUrl}" alt="Preview"/>
        <button class="remove-preview" onclick="window.removeImagePreview()">Remove</button>
    `;
    imagePreview.style.display = 'block';
    sendImageBtn.textContent = 'Send Image';
}

// Remove image preview
window.removeImagePreview = function () {
    clearImagePreview();
};

function clearImagePreview() {
    pendingImageData = null;
    imagePreview.innerHTML = '';
    imagePreview.style.display = 'none';
    sendImageBtn.textContent = 'Send Image';
}

// Send image if preview exists, else open file dialog
sendImageBtn.onclick = () => {
    if (pendingImageData) {
        socket.emit('chat-image', pendingImageData);
        clearImagePreview();
    } else {
        imageInput.click();
    }
};

// Handle file selection for preview
imageInput.addEventListener('change', function () {
    if (imageInput.files && imageInput.files[0]) {
        const file = imageInput.files[0];
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function (e) {
                showImagePreview(e.target.result);
            };
            reader.readAsDataURL(file);
        }
        imageInput.value = '';
    }
});

// Handle paste event for images (preview)
messageInput.addEventListener('paste', function (e) {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            const reader = new FileReader();
            reader.onload = function (event) {
                showImagePreview(event.target.result);
            };
            reader.readAsDataURL(file);
            e.preventDefault();
        }
    }
});

// Add image message to chat
function addImageMessage(user, imageData, time) {
    const div = document.createElement('div');
    div.classList.add('message');
    let timeHtml = '';
    if (time) {
        timeHtml = `<span class="msg-time">${formatTime(time)}</span>`;
    }
    div.innerHTML = `<span class="user">${user}:</span> ${timeHtml}<br/><img src="${imageData}" style="max-width:300px;max-height:300px;border-radius:8px;margin-top:4px;" />`;

    // Style time to the right
    if (time) {
        div.querySelector('.msg-time').style.float = 'right';
        div.querySelector('.msg-time').style.color = '#888';
        div.querySelector('.msg-time').style.fontSize = '12px';
        div.querySelector('.msg-time').style.marginLeft = '8px';
    }

    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

// Toggle dark mode
toggleDarkBtn.onclick = function () {
    document.body.classList.toggle('dark');
    if (document.body.classList.contains('dark')) {
        localStorage.setItem('theme', 'dark');
        toggleDarkBtn.textContent = '☀️';
    } else {
        localStorage.setItem('theme', 'light');
        toggleDarkBtn.textContent = '🌙';
    }
};

// On load, set theme from preference (default to light)
(function () {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
        document.body.classList.add('dark');
        toggleDarkBtn.textContent = '☀️';
    } else {
        document.body.classList.remove('dark');
        toggleDarkBtn.textContent = '🌙';
    }
})();
