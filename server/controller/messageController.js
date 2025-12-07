const Message = require("../models/messageModel");
const User = require("../models/userModel");
const cloudinary = require('../lib/cloudinary');
const { encryptData } = require('../utils/encryption');

// Import will be done dynamically to avoid circular dependency
let io, userSocketMap;

const getSocketInstances = () => {
    if (!io || !userSocketMap) {
        const server = require("../server");
        io = server.io;
        userSocketMap = server.userSocketMap;
    }
    return { io, userSocketMap };
};
exports.getUsersforSidebar = async (req, res) => {
    try {
        const id = req.user._id;
        const users = await User.find({ _id: { $ne: id } }).select('-password');

        const unseenMessages = {};
        const lastMessages = {};

        const promises = users.map(async (user) => {
            // Get unseen messages count
            const messages = await Message.find({ senderId: user._id, receiverId: id, seen: false });
            if (messages.length > 0) {
                unseenMessages[user._id] = messages.length;
            }

            // Get last message between current user and this user
            const lastMessage = await Message.findOne({
                $or: [
                    { senderId: id, receiverId: user._id },
                    { senderId: user._id, receiverId: id }
                ]
            }).sort({ createdAt: -1 });

            if (lastMessage) {
                lastMessages[user._id] = {
                    text: lastMessage.messageText || (lastMessage.messageImage ? '📷 Image' : ''),
                    time: lastMessage.createdAt,
                    senderId: lastMessage.senderId
                };
            }
        })
        await Promise.all(promises);
        res.json({ status: 'success', users, unseenMessages, lastMessages });
    }
    catch (err) {
        res.json({
            status: "fail",
            message: err.message,
        })
    }
}

//get messages between logged in user and selected user
exports.getMessages = async (req, res) => {
    try {
        const { id: selectedUserId } = req.params;
        const myId = req.user._id;
        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: selectedUserId },
                { senderId: selectedUserId, receiverId: myId },
            ]
        }).sort({ createdAt: 1 });
        await Message.updateMany({ senderId: selectedUserId, receiverId: myId }, { seen: true });
        res.json({ status: 'success', message: messages });
    }
    catch (err) {
        res.json({
            status: "fail",
            message: err.message,
        })
    }
}
//mark message as seen which is sent by receiver
exports.markMessageAsSeen = async (req, res) => {
    try {
        const { id } = req.params;
        await Message.findByIdAndUpdate(id, { seen: true });
        res.json({
            status: 'success',
            message: 'Message marked as seen',
        })
    }
    catch (err) {
        res.json({
            status: "fail",
            message: err.message,
        })
    }
}

exports.sendMessage = async (req, res) => {
    try {
        const receiverId = req.params.id;
        const { text, image } = req.body;
        const senderId = req.user._id;
        // Validate receiver exists
        const receiver = await User.findById(receiverId).select('-password');
        if (!receiver) {
            return res.status(404).json({
                status: 'fail',
                message: 'Receiver not found',
            });
        }

        if ((!text || text.trim() === '') && !image) {
            return res.json({
                status: 'fail',
                message: 'Message cannot be empty',
            })
        }
        let imageUrl;
        if (image) {
            // Upload image to Cloudinary
            cloudinary.config({
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET,
                secure: true
            });

            const uploadResponse = await cloudinary.uploader.upload(image);
            const plainImageUrl = uploadResponse.secure_url;

            // Encrypt the Cloudinary URL before storing in database
            imageUrl = encryptData(plainImageUrl, senderId.toString(), receiverId.toString());
            console.log('🖼️ Image uploaded and URL encrypted');
        }
        const message = await Message.create({
            senderId,
            receiverId,
            messageText: text,
            messageImage: imageUrl,
        })

        //emit the new message to receiver's socket
        // Get socket instances dynamically to avoid circular dependency
        const { io: socketIo, userSocketMap: socketMap } = getSocketInstances();

        // Convert to strings for userSocketMap lookup
        const receiverIdStr = String(receiverId);
        const senderIdStr = String(senderId);

        const receiverSocketId = socketMap && socketMap[receiverIdStr];
        const senderSocketId = socketMap && socketMap[senderIdStr];

        console.log("\n=== Sending Message via Socket ===");
        console.log("Receiver ID:", receiverIdStr);
        console.log("Sender ID:", senderIdStr);
        console.log("User Socket Map:", JSON.stringify(socketMap, null, 2));
        console.log("Receiver Socket ID:", receiverSocketId);
        console.log("Sender Socket ID:", senderSocketId);
        console.log("Message ID:", message._id);

        if (receiverSocketId) {
            console.log("✓ Emitting to receiver socket:", receiverSocketId);
            socketIo.to(receiverSocketId).emit("newMessage", message);
        } else {
            console.log("✗ Receiver not online or socket not found");
        }

        // Also emit to sender for real-time sync across tabs/devices
        if (senderSocketId) {
            console.log("✓ Emitting to sender socket:", senderSocketId);
            socketIo.to(senderSocketId).emit("newMessage", message);
        } else {
            console.log("✗ Sender socket not found");
        }
        console.log("=== End Socket Emission ===\n");

        res.json({ status: 'success', message });
    }
    catch (err) {
        console.log(err.message)
        res.status(400).json({
            status: "fail",
            message: err.message,
        })
    }
}