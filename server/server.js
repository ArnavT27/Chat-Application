const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables first
dotenv.config({ path: path.join(__dirname, 'config.env') });

// Now load other modules
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { Server } = require('socket.io');
const http = require('http');
const authRouter = require('./routes/authRouter');
const messageRouter = require('./routes/messageRouter');
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.DATABASE_PASSWORD);
const port = process.env.PORT || 8000;
mongoose.connect(DB).then(() => {
    console.log("DB connected");
})
const allowedOrigin = ['http://localhost:5173']
const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
app.use(cookieParser());
app.use(cors({ credentials: true, origin: allowedOrigin }));

// app.use('/',(req,res)=>{
//     res.send("Hello")
// })
app.use('/api/messages', messageRouter);
app.use('/api/auth', authRouter);

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: allowedOrigin } });
exports.io = io;

//store online users
const userSocketMap = {}
exports.userSocketMap = userSocketMap//{userId:socketId}

//socket.io connection handler
io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    // console.log("User connnected", userId);

    if (userId) {
        userSocketMap[userId] = socket.id;
        // console.log(userSocketMap[userId])
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
    socket.on("disconnect", () => {
        // console.log("User disconnected",userId);
        if (userId) {
            delete userSocketMap[userId];
        }
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    })
})

server.listen(port, () => {
    console.log(`Connected to ${port}`)
})
