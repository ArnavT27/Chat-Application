const Message = require("../models/messageModel");
const User = require("../models/userModel");
const cloudinary = require('../lib/cloudinary');
const { io, userSocketMap } = require("../server");

// Add safety check for userSocketMap
if (!userSocketMap) {
    console.warn("userSocketMap is not available - socket messaging may not work properly");
}
exports.getUsersforSidebar = async (req, res) => {
    try {
        const id = req.user._id;
        const users = await User.find({ _id: { $ne: id } }).select('-password');

        const unseenMessages = {};
        const promises = users.map(async (user) => {
            const messages = await Message.find({ senderId: user._id, receiverId: id, seen: false });
            if (messages.length > 0) {
                unseenMessages[user._id] = messages.length;
            }
        })
        await Promise.all(promises);
        res.json({ status: 'success', users, unseenMessages });
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
            // Ensure Cloudinary is properly configured before upload
            cloudinary.config({
                cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
                api_key: process.env.CLOUDINARY_API_KEY,
                api_secret: process.env.CLOUDINARY_API_SECRET,
                secure: true
            });

            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }
        const message = await Message.create({
            senderId,
            receiverId,
            messageText: text,
            messageImage: imageUrl,
        })

        //emit the new message to receiver's socket
        const receiverSocketId = userSocketMap && userSocketMap[receiverId];
        console.log("Receiver ID:", receiverId);
        console.log("User Socket Map:", userSocketMap);
        console.log("Receiver Socket ID:", receiverSocketId);

        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", message)
        }
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