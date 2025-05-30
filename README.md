# chatbox-cli

Chatting in local network with command-line interface.

> ⚠️ **A quick note about this project**

This project was originally built for a **CLI-based (Command Line Interface)** chat experience — hence the name `chatbox-cli`.  
However, after a sudden change of heart 🫠, I decided to switch gears and focus on developing a **web-based version** instead.

As a result, the current source code is mainly for the **website version**.

If you're interested in the CLI version, don’t worry! I’ve kept some of the original files like `client.js`, and with a few tweaks to `server.js`, you can get it working on the command line again.  
Feel free to **fork, explore, or mess around** with the repo as you like :v

**Thanks a lot!**

---

# 💬 Chatbox

A simple web-based chatbox built with Node.js and Socket.io.  
Perfect for quick real-time messaging over LAN or localhost!

---

## 🚀 Features

- 🧠 Real-time communication using WebSockets (Socket.io)
- 🛜 Host your own lightweight chat server
- 🧼 Minimal setup, easy to run
- 🎨 Basic front-end included (no need for fancy frameworks)

---

## 🛠️ Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/nghtudung/chatbox-cli.git
cd chatbox-cli
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the server

```bash
node server.js
```

By default, the server runs on port `4953`. You can change this by editing the `PORT` variable in `server.js`.

### 4. Open your browser

Go to:

```
http://localhost:4953
```

(Or replace `4953` with the port you chose.)

---

## 🧪 Example

Open the link in two separate browser tabs/windows. Start chatting in real time!

---

## 📁 Project Structure

```
chatbox-cli/
├── public/
│   ├── index.html       # Chat UI
│   ├── style.css        # Chat UI
│   └── script.js        # Client-side Socket.io logic
├── server.js            # Server logic using Express + Socket.io
├── package.json
└── README.md
```

---

## 🙌 Contributing

Feel free to fork this repo, submit pull requests, or open issues if you have ideas, questions, or bugs.
This is a small side project, but I’m happy if it helps someone out there!

---

## 🧃 License

MIT License.
Use it however you like — just don’t forget to drink water 💦

---

From [GieJack™](https://www.youtube.com/watch?v=dQw4w9WgXcQ) with love <3