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
const fileInput = document.getElementById('file-input');
const sendFileBtn = document.getElementById('send-file');

let currentUser = null;
let pendingImageData = null;

messageInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        if (e.ctrlKey) {
            e.preventDefault();
            sendCodeBtn.click();
        } else if (e.altKey) {
            e.preventDefault();
            sendImageBtn.click();
        } else if (e.shiftKey) {
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
        sendImageBtn.disabled = false;
        sendFileBtn.disabled = false;
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
        addSystemMessage('/whisper arg1 arg2 - Send private message to someone');
    } else if (command === 'clear') {
        chat.innerHTML = '';
    } else if (command === 'about') {
        addSystemMessage('Chat Box v1.1.0, hẹ hẹ hẹ, from GieJack™ with love <3');
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

function formatTime(isoString) {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

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

window.addEventListener('beforeunload', () => {
    if (currentUser) {
        socket.emit('leave', currentUser);
    }
});

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
        const safeMsg = replaceEmojis(escapeHtml(msg)).replace(/\n/g, '<br>');
        div.innerHTML = `<span class="user">${user}:</span> ${safeMsg}${timeHtml}`;
    }
    if (time) {
        div.querySelector('.msg-time').style.float = 'right';
        div.querySelector('.msg-time').style.color = '#888';
        div.querySelector('.msg-time').style.fontSize = '12px';
        div.querySelector('.msg-time').style.marginLeft = '8px';
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
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}

function showImagePreview(dataUrl) {
    pendingImageData = dataUrl;
    imagePreview.innerHTML = `
        <img src="${dataUrl}" alt="Preview"/>
        <button class="remove-preview" onclick="window.removeImagePreview()">Remove</button>
    `;
    imagePreview.style.display = 'block';
    sendImageBtn.textContent = 'Send Image';
}

window.removeImagePreview = function () {
    clearImagePreview();
};

function clearImagePreview() {
    pendingImageData = null;
    imagePreview.innerHTML = '';
    imagePreview.style.display = 'none';
    sendImageBtn.textContent = 'Send Image';
}

sendImageBtn.onclick = () => {
    if (pendingImageData) {
        fetch(pendingImageData)
            .then(res => res.blob())
            .then(blob => {
                const formData = new FormData();
                formData.append('image', blob, 'image.png');
                return fetch('/upload-image', {
                    method: 'POST',
                    body: formData
                });
            })
            .then(res => res.json())
            .then(data => {
                if (data.url) {
                    socket.emit('chat-image', data.url);
                } else {
                    addSystemMessage('❌ Image upload failed');
                }
                clearImagePreview();
            })
            .catch(() => {
                addSystemMessage('❌ Image upload failed');
                clearImagePreview();
            });
    } else {
        imageInput.click();
    }
};

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

function addImageMessage(user, imageUrl, time) {
    const div = document.createElement('div');
    div.classList.add('message');
    let timeHtml = '';
    if (time) {
        timeHtml = `<span class="msg-time">${formatTime(time)}</span>`;
    }
    div.innerHTML = `<span class="user">${user}:</span> ${timeHtml}<br/><img src="${imageUrl}" style="max-width:300px;max-height:300px;border-radius:8px;margin-top:4px;" />`;
    if (time) {
        div.querySelector('.msg-time').style.float = 'right';
        div.querySelector('.msg-time').style.color = '#888';
        div.querySelector('.msg-time').style.fontSize = '12px';
        div.querySelector('.msg-time').style.marginLeft = '8px';
    }
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

sendFileBtn.onclick = () => {
    if (fileInput.files && fileInput.files[0]) {
        const file = fileInput.files[0];
        const formData = new FormData();
        formData.append('file', file, file.name);
        fetch('/upload-file', {
            method: 'POST',
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                if (data.url) {
                    socket.emit('chat-file', {
                        name: data.name,
                        url: data.url
                    });
                } else {
                    addSystemMessage('❌ File upload failed');
                }
            })
            .catch(() => {
                addSystemMessage('❌ File upload failed');
            });
        fileInput.value = '';
    } else {
        fileInput.click();
    }
};

fileInput.addEventListener('change', function () {
    if (fileInput.files && fileInput.files[0]) {
        sendFileBtn.click();
    }
});

socket.on('chat-file', (data) => {
    const label = data.user === currentUser ? 'You' : data.user;
    addFileMessage(label, data, data.time);
});

function addFileMessage(user, fileData, time) {
    const div = document.createElement('div');
    div.classList.add('message');
    let timeHtml = '';
    if (time) {
        timeHtml = `<span class="msg-time">${formatTime(time)}</span>`;
    }
    const link = document.createElement('a');
    link.href = fileData.url;
    link.download = fileData.name;
    link.textContent = `📎 ${fileData.name}`;
    link.target = '_blank';
    link.style.wordBreak = 'break-all';
    div.innerHTML = `<span class="user">${user}:</span> ${timeHtml}<br/>`;
    div.appendChild(link);
    if (time) {
        div.querySelector('.msg-time').style.float = 'right';
        div.querySelector('.msg-time').style.color = '#888';
        div.querySelector('.msg-time').style.fontSize = '12px';
        div.querySelector('.msg-time').style.marginLeft = '8px';
    }
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

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

const emojiMap = {
    ':)': '😊',
    ':-)': '😊',
    ':(': '😞',
    ':-(': '😞',
    ':D': '😃',
    ':-D': '😃',
    ':P': '😛',
    ':-P': '😛',
    ';P': '😜',
    ';-P': '😜',
    ';)': '😉',
    ';-)': '😉',
    ':o': '😮',
    ':O': '😮',
    ':|': '😐',
    ':*': '😘',
    '<3': '❤️',
    '</3': '💔',
    ':poop:': '💩',
    ':skull:': '💀',
    ':fire:': '🔥',
    ':thumbsup:': '👍',
    ':+1:': '👍',
    ':thumbsdown:': '👎',
    ':-1:': '👎',
    ':clap:': '👏',
    ':ok:': '👌',
    ':100:': '💯',
    ':star:': '⭐',
    ':star2:': '🌟',
    ':cry:': '😢',
    ":'(": '😢',
    ':joy:': '😂',
    ':sob:': '😭',
    ':lol:': '😂',
    ':rofl:': '🤣',
    ':grin:': '😁',
    ':smile:': '😄',
    ':sweat_smile:': '😅',
    ':wink:': '😉',
    ':blush:': '😊',
    ':relaxed:': '☺️',
    ':yum:': '😋',
    ':sunglasses:': '😎',
    ':cool:': '😎',
    ':angry:': '😠',
    ':rage:': '😡',
    ':confused:': '😕',
    ':neutral:': '😐',
    ':expressionless:': '😑',
    ':sleeping:': '😴',
    ':zzz:': '💤',
    ':sleepy:': '😪',
    ':dizzy:': '💫',
    ':scream:': '😱',
    ':fearful:': '😨',
    ':astonished:': '😲',
    ':open_mouth:': '😮',
    ':hushed:': '😯',
    ':thinking:': '🤔',
    ':facepalm:': '🤦',
    ':shrug:': '🤷',
    ':pray:': '🙏',
    ':muscle:': '💪',
    ':eyes:': '👀',
    ':see_no_evil:': '🙈',
    ':hear_no_evil:': '🙉',
    ':speak_no_evil:': '🙊',
    ':monkey:': '🐒',
    ':cat:': '🐱',
    ':dog:': '🐶',
    ':fox:': '🦊',
    ':panda:': '🐼',
    ':bear:': '🐻',
    ':tiger:': '🐯',
    ':lion:': '🦁',
    ':unicorn:': '🦄',
    ':dragon:': '🐉',
    ':alien:': '👽',
    ':robot:': '🤖',
    ':ghost:': '👻',
    ':poop:': '💩',
    ':skull:': '💀',
    ':heart:': '❤️',
    ':broken_heart:': '💔',
    ':gift:': '🎁',
    ':tada:': '🎉',
    ':balloon:': '🎈',
    ':cake:': '🎂',
    ':beer:': '🍺',
    ':coffee:': '☕',
    ':tea:': '🍵',
    ':pizza:': '🍕',
    ':hamburger:': '🍔',
    ':fries:': '🍟',
    ':apple:': '🍎',
    ':banana:': '🍌',
    ':watermelon:': '🍉',
    ':grapes:': '🍇',
    ':carrot:': '🥕',
    ':corn:': '🌽',
    ':eggplant:': '🍆',
    ':peach:': '🍑',
    ':cherry_blossom:': '🌸',
    ':rose:': '🌹',
    ':sunflower:': '🌻',
    ':cactus:': '🌵',
    ':tree:': '🌳',
    ':cloud:': '☁️',
    ':sun:': '☀️',
    ':moon:': '🌙',
    ':rainbow:': '🌈',
    ':zap:': '⚡',
    ':snowflake:': '❄️',
    ':star:': '⭐',
    ':star2:': '🌟',
    ':sparkles:': '✨',
    ':boom:': '💥',
    ':bomb:': '💣',
    ':moneybag:': '💰',
    ':gem:': '💎',
    ':crown:': '👑',
    ':medal:': '🏅',
    ':trophy:': '🏆',
    ':soccer:': '⚽',
    ':basketball:': '🏀',
    ':football:': '🏈',
    ':baseball:': '⚾',
    ':tennis:': '🎾',
    ':8ball:': '🎱',
    ':game_die:': '🎲',
    ':guitar:': '🎸',
    ':violin:': '🎻',
    ':microphone:': '🎤',
    ':headphones:': '🎧',
    ':camera:': '📷',
    ':phone:': '📱',
    ':computer:': '💻',
    ':tv:': '📺',
    ':car:': '🚗',
    ':taxi:': '🚕',
    ':bus:': '🚌',
    ':train:': '🚆',
    ':airplane:': '✈️',
    ':rocket:': '🚀',
    ':ship:': '🚢',
    ':anchor:': '⚓',
    ':wheelchair:': '♿',
    ':warning:': '⚠️',
    ':no_entry:': '⛔',
    ':checkered_flag:': '🏁',
    ':flag:': '🏳️',
    ':rain:': '🌧️',
    ':snowman:': '⛄',
    ':skibidi:': '🚽',
    ':AD:': '🇦🇩', ':AE:': '🇦🇪', ':AF:': '🇦🇫', ':AG:': '🇦🇬', ':AI:': '🇦🇮',
    ':AL:': '🇦🇱', ':AM:': '🇦🇲', ':AO:': '🇦🇴', ':AQ:': '🇦🇶', ':AR:': '🇦🇷',
    ':AS:': '🇦🇸', ':AT:': '🇦🇹', ':AU:': '🇦🇺', ':AW:': '🇦🇼', ':AX:': '🇦🇽',
    ':AZ:': '🇦🇿', ':BA:': '🇧🇦', ':BB:': '🇧🇧', ':BD:': '🇧🇩', ':BE:': '🇧🇪',
    ':BF:': '🇧🇫', ':BG:': '🇧🇬', ':BH:': '🇧🇭', ':BI:': '🇧🇮', ':BJ:': '🇧🇯',
    ':BL:': '🇧🇱', ':BM:': '🇧🇲', ':BN:': '🇧🇳', ':BO:': '🇧🇴', ':BQ:': '🇧🇶',
    ':BR:': '🇧🇷', ':BS:': '🇧🇸', ':BT:': '🇧🇹', ':BV:': '🇧🇻', ':BW:': '🇧🇼',
    ':BY:': '🇧🇾', ':BZ:': '🇧🇿', ':CA:': '🇨🇦', ':CC:': '🇨🇨', ':CD:': '🇨🇩',
    ':CF:': '🇨🇫', ':CG:': '🇨🇬', ':CH:': '🇨🇭', ':CI:': '🇨🇮', ':CK:': '🇨🇰',
    ':CL:': '🇨🇱', ':CM:': '🇨🇲', ':CN:': '🇨🇳', ':CO:': '🇨🇴', ':CR:': '🇨🇷',
    ':CU:': '🇨🇺', ':CV:': '🇨🇻', ':CW:': '🇨🇼', ':CX:': '🇨🇽', ':CY:': '🇨🇾',
    ':CZ:': '🇨🇿', ':DE:': '🇩🇪', ':DJ:': '🇩🇯', ':DK:': '🇩🇰', ':DM:': '🇩🇲',
    ':DO:': '🇩🇴', ':DZ:': '🇩🇿', ':EC:': '🇪🇨', ':EE:': '🇪🇪', ':EG:': '🇪🇬',
    ':EH:': '🇪🇭', ':ER:': '🇪🇷', ':ES:': '🇪🇸', ':ET:': '🇪🇹', ':FI:': '🇫🇮',
    ':FJ:': '🇫🇯', ':FK:': '🇫🇰', ':FM:': '🇫🇲', ':FO:': '🇫🇴', ':FR:': '🇫🇷',
    ':GA:': '🇬🇦', ':GB:': '🇬🇧', ':GD:': '🇬🇩', ':GE:': '🇬🇪', ':GF:': '🇬🇫',
    ':GG:': '🇬🇬', ':GH:': '🇬🇭', ':GI:': '🇬🇮', ':GL:': '🇬🇱', ':GM:': '🇬🇲',
    ':GN:': '🇬🇳', ':GP:': '🇬🇵', ':GQ:': '🇬🇶', ':GR:': '🇬🇷', ':GS:': '🇬🇸',
    ':GT:': '🇬🇹', ':GU:': '🇬🇺', ':GW:': '🇬🇼', ':GY:': '🇬🇾', ':HK:': '🇭🇰',
    ':HM:': '🇭🇲', ':HN:': '🇭🇳', ':HR:': '🇭🇷', ':HT:': '🇭🇹', ':HU:': '🇭🇺',
    ':ID:': '🇮🇩', ':IE:': '🇮🇪', ':IL:': '🇮🇱', ':IM:': '🇮🇲', ':IN:': '🇮🇳',
    ':IO:': '🇮🇴', ':IQ:': '🇮🇶', ':IR:': '🇮🇷', ':IS:': '🇮🇸', ':IT:': '🇮🇹',
    ':JE:': '🇯🇪', ':JM:': '🇯🇲', ':JO:': '🇯🇴', ':JP:': '🇯🇵', ':KE:': '🇰🇪',
    ':KG:': '🇰🇬', ':KH:': '🇰🇭', ':KI:': '🇰🇮', ':KM:': '🇰🇲', ':KN:': '🇰🇳',
    ':KP:': '🇰🇵', ':KR:': '🇰🇷', ':KW:': '🇰🇼', ':KY:': '🇰🇾', ':KZ:': '🇰🇿',
    ':LA:': '🇱🇦', ':LB:': '🇱🇧', ':LC:': '🇱🇨', ':LI:': '🇱🇮', ':LK:': '🇱🇰',
    ':LR:': '🇱🇷', ':LS:': '🇱🇸', ':LT:': '🇱🇹', ':LU:': '🇱🇺', ':LV:': '🇱🇻',
    ':LY:': '🇱🇾', ':MA:': '🇲🇦', ':MC:': '🇲🇨', ':MD:': '🇲🇩', ':ME:': '🇲🇪',
    ':MF:': '🇲🇫', ':MG:': '🇲🇬', ':MH:': '🇲🇭', ':MK:': '🇲🇰', ':ML:': '🇲🇱',
    ':MM:': '🇲🇲', ':MN:': '🇲🇳', ':MO:': '🇲🇴', ':MP:': '🇲🇵', ':MQ:': '🇲🇶',
    ':MR:': '🇲🇷', ':MS:': '🇲🇸', ':MT:': '🇲🇹', ':MU:': '🇲🇺', ':MV:': '🇲🇻',
    ':MW:': '🇲🇼', ':MX:': '🇲🇽', ':MY:': '🇲🇾', ':MZ:': '🇲🇿', ':NA:': '🇳🇦',
    ':NC:': '🇳🇨', ':NE:': '🇳🇪', ':NF:': '🇳🇫', ':NG:': '🇳🇬', ':NI:': '🇳🇮',
    ':NL:': '🇳🇱', ':NO:': '🇳🇴', ':NP:': '🇳🇵', ':NR:': '🇳🇷', ':NU:': '🇳🇺',
    ':NZ:': '🇳🇿', ':OM:': '🇴🇲', ':PA:': '🇵🇦', ':PE:': '🇵🇪', ':PF:': '🇵🇫',
    ':PG:': '🇵🇬', ':PH:': '🇵🇭', ':PK:': '🇵🇰', ':PL:': '🇵🇱', ':PM:': '🇵🇲',
    ':PN:': '🇵🇳', ':PR:': '🇵🇷', ':PS:': '🇵🇸', ':PT:': '🇵🇹', ':PW:': '🇵🇼',
    ':PY:': '🇵🇾', ':QA:': '🇶🇦', ':RE:': '🇷🇪', ':RO:': '🇷🇴', ':RS:': '🇷🇸',
    ':RU:': '🇷🇺', ':RW:': '🇷🇼', ':SA:': '🇸🇦', ':SB:': '🇸🇧', ':SC:': '🇸🇨',
    ':SD:': '🇸🇩', ':SE:': '🇸🇪', ':SG:': '🇸🇬', ':SH:': '🇸🇭', ':SI:': '🇸🇮',
    ':SJ:': '🇸🇯', ':SK:': '🇸🇰', ':SL:': '🇸🇱', ':SM:': '🇸🇲', ':SN:': '🇸🇳',
    ':SO:': '🇸🇴', ':SR:': '🇸🇷', ':SS:': '🇸🇸', ':ST:': '🇸🇹', ':SV:': '🇸🇻',
    ':SX:': '🇸🇽', ':SY:': '🇸🇾', ':SZ:': '🇸🇿', ':TC:': '🇹🇨', ':TD:': '🇹🇩',
    ':TF:': '🇹🇫', ':TG:': '🇹🇬', ':TH:': '🇹🇭', ':TJ:': '🇹🇯', ':TK:': '🇹🇰',
    ':TL:': '🇹🇱', ':TM:': '🇹🇲', ':TN:': '🇹🇳', ':TO:': '🇹🇴', ':TR:': '🇹🇷',
    ':TT:': '🇹🇹', ':TV:': '🇹🇻', ':TW:': '🇹🇼', ':TZ:': '🇹🇿', ':UA:': '🇺🇦',
    ':UG:': '🇺🇬', ':UM:': '🇺🇲', ':US:': '🇺🇸', ':UY:': '🇺🇾', ':UZ:': '🇺🇿',
    ':VA:': '🇻🇦', ':VC:': '🇻🇨', ':VE:': '🇻🇪', ':VG:': '🇻🇬', ':VI:': '🇻🇮',
    ':VN:': '🇻🇳', ':VU:': '🇻🇺', ':WF:': '🇼🇫', ':WS:': '🇼🇸', ':YE:': '🇾🇪',
    ':YT:': '🇾🇹', ':ZA:': '🇿🇦', ':ZM:': '🇿🇲', ':ZW:': '🇿🇼',
    ':VNM:': '🇻🇳', ':USA:': '🇺🇸', ':JPN:': '🇯🇵', ':KOR:': '🇰🇷', ':CHN:': '🇨🇳',
    ':FRA:': '🇫🇷', ':DEU:': '🇩🇪', ':ITA:': '🇮🇹', ':ESP:': '🇪🇸', ':GBR:': '🇬🇧',
    ':RUS:': '🇷🇺', ':UKR:': '🇺🇦', ':THA:': '🇹🇭', ':SGP:': '🇸🇬', ':PHL:': '🇵🇭',
    ':IDN:': '🇮🇩', ':MYS:': '🇲🇾', ':LAO:': '🇱🇦', ':KHM:': '🇰🇭', ':CAN:': '🇨🇦',
    ':AUS:': '🇦🇺', ':BRA:': '🇧🇷', ':IND:': '🇮🇳', ':TUR:': '🇹🇷', ':SAU:': '🇸🇦',
    ':ARG:': '🇦🇷', ':MEX:': '🇲🇽', ':ZAF:': '🇿🇦', ':EGY:': '🇪🇬', ':NGA:': '🇳🇬',
    ':PAK:': '🇵🇰', ':POL:': '🇵🇱', ':SWE:': '🇸🇪', ':FIN:': '🇫🇮', ':NOR:': '🇳🇴',
    ':DNK:': '🇩🇰', ':NLD:': '🇳🇱', ':BEL:': '🇧🇪', ':CHE:': '🇨🇭', ':AUT:': '🇦🇹',
    ':NZL:': '🇳🇿'
};

function replaceEmojis(text) {
    const keys = Object.keys(emojiMap).sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const regex = new RegExp('(' + keys.join('|') + ')', 'g');
    return text.replace(regex, match => emojiMap[match] || match);
}