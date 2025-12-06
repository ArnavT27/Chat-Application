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
        console.log(`User ${userId} connected with socket ID: ${socket.id}`);
        console.log(`Current userSocketMap:`, JSON.stringify(userSocketMap, null, 2));
    }
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
    
    // Video call handlers
    socket.on("video-call-initiate", (data) => {
        const { targetUserId, caller } = data;
        console.log(`\n=== Video Call Initiate ===`);
        console.log(`From user: ${userId}`);
        console.log(`To user: ${targetUserId}`);
        console.log(`Caller data:`, JSON.stringify(caller, null, 2));
        console.log(`Current userSocketMap:`, JSON.stringify(userSocketMap, null, 2));
        
        const targetSocketId = userSocketMap[targetUserId];
        console.log(`Target socket ID: ${targetSocketId}`);
        
        if (targetSocketId) {
            console.log(`✓ Sending incoming call notification to socket ${targetSocketId}`);
            io.to(targetSocketId).emit("video-call-incoming", {
                caller: caller,
            });
            console.log(`✓ Event emitted successfully\n`);
        } else {
            console.log(`✗ Target user ${targetUserId} is not online or not found in userSocketMap`);
            console.log(`Available users:`, Object.keys(userSocketMap));
            console.log(`\n`);
        }
    });

    socket.on("video-call-accept", (data) => {
        const { callerId } = data;
        const callerSocketId = userSocketMap[callerId];
        if (callerSocketId) {
            io.to(callerSocketId).emit("video-call-accepted");
        }
    });

    socket.on("video-call-reject", (data) => {
        const { callerId } = data;
        const callerSocketId = userSocketMap[callerId];
        if (callerSocketId) {
            io.to(callerSocketId).emit("video-call-rejected");
        }
    });

    socket.on("video-call-end", (data) => {
        const { targetUserId } = data;
        const targetSocketId = userSocketMap[targetUserId];
        if (targetSocketId) {
            io.to(targetSocketId).emit("video-call-ended");
        }
    });

    socket.on("video-call-offer", (data) => {
        const { targetUserId } = data;
        const targetSocketId = userSocketMap[targetUserId];
        if (targetSocketId) {
            io.to(targetSocketId).emit("video-call-offer", {
                offer: data.offer,
                fromUserId: userId,
            });
        }
    });

    socket.on("video-call-answer", (data) => {
        const { targetUserId } = data;
        const targetSocketId = userSocketMap[targetUserId];
        if (targetSocketId) {
            io.to(targetSocketId).emit("video-call-answer", {
                answer: data.answer,
            });
        }
    });

    socket.on("video-call-ice-candidate", (data) => {
        const { targetUserId } = data;
        const targetSocketId = userSocketMap[targetUserId];
        if (targetSocketId) {
            io.to(targetSocketId).emit("video-call-ice-candidate", {
                candidate: data.candidate,
            });
        }
    });

    socket.on("disconnect", () => {
        console.log(`User ${userId} disconnected`);
        if (userId) {
            delete userSocketMap[userId];
        }
        console.log(`Updated userSocketMap:`, JSON.stringify(userSocketMap, null, 2));
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
    })
})

server.listen(port, () => {
    console.log(`Connected to ${port}`)
})
