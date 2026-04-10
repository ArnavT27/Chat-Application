# 💬 Real-Time Chat Application

A modern, feature-rich real-time chat application built with the MERN stack, featuring end-to-end encryption, video calling, and a beautiful UI.

![Chat Application](https://img.shields.io/badge/MERN-Stack-green)
![License](https://img.shields.io/badge/license-MIT-blue)
![Node](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)

## ✨ Features

### 🔐 Security
- **End-to-End Encryption**: All messages are encrypted using AES-128-CBC encryption
- **Secure Authentication**: JWT-based authentication with HTTP-only cookies
- **Password Security**: Bcrypt password hashing
- **Email Verification**: Mailtrap integration for email verification

### 💬 Messaging
- **Real-time Messaging**: Instant message delivery using Socket.IO
- **Text Messages**: Send and receive encrypted text messages
- **Image Sharing**: Upload and share images via Cloudinary
- **Emoji Support**: Built-in emoji picker for expressive conversations
- **Message Status**: See when messages are delivered and read
- **Last Message Preview**: View the last message in conversation list

### 📹 Video Calling
- **WebRTC Video Calls**: Peer-to-peer video calling
- **Call Controls**: Mute/unmute audio, toggle video on/off
- **Accept/Reject Calls**: Full control over incoming calls
- **Real-time Connection**: Low-latency video streaming

### 👥 User Features
- **User Profiles**: Customizable profile with avatar upload
- **Online Status**: See who's online in real-time
- **User Search**: Search for conversations
- **Profile Management**: Update profile information and password

### 🎨 UI/UX
- **Modern Design**: Beautiful gradient-based UI with glassmorphism effects
- **Responsive Layout**: Works seamlessly on desktop and mobile
- **Smooth Animations**: Framer Motion animations throughout
- **Dark Theme**: Eye-friendly dark interface
- **Toast Notifications**: Real-time feedback for user actions

## 🛠️ Tech Stack

### Frontend
- **React 19** - UI library
- **Vite** - Build tool and dev server
- **TailwindCSS 4** - Utility-first CSS framework
- **Framer Motion** - Animation library
- **Socket.IO Client** - Real-time communication
- **Axios** - HTTP client
- **React Router** - Client-side routing
- **CryptoJS** - Encryption library
- **Emoji Picker React** - Emoji selection
- **Lucide React** - Icon library

### Backend
- **Node.js** - Runtime environment
- **Express** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **Socket.IO** - Real-time bidirectional communication
- **JWT** - Authentication tokens
- **Bcrypt** - Password hashing
- **Cloudinary** - Image storage and CDN
- **Mailtrap** - Email service for development

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- npm or yarn

## 🚀 Installation

### 1. Clone the repository
```bash
git clone https://github.com/ArnavT27/Chat-Application.git
cd Chat-Application
```

### 2. Install dependencies

#### Install root dependencies
```bash
npm install
```

#### Install server dependencies
```bash
cd server
npm install
cd ..
```

#### Install client dependencies
```bash
cd client
npm install
cd ..
```

### 3. Environment Variables

#### Server Configuration
Create a `server/config.env` file:

```env
# MongoDB
MONGO_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

# Mailtrap
MAILTRAP_TOKEN=your_mailtrap_token
MAILTRAP_ENDPOINT=https://send.api.mailtrap.io/

# Server
PORT=5000
NODE_ENV=development
```

#### Client Configuration
Create a `client/.env` file:

```env
VITE_BACKEND_URL=http://localhost:5000
```

### 4. Run the Application

#### Development Mode

Run both client and server concurrently from the root directory:
```bash
npm run dev
```

Or run them separately:

**Server:**
```bash
cd server
npm run dev
```

**Client:**
```bash
cd client
npm run dev
```

#### Production Mode

**Build the client:**
```bash
cd client
npm run build
```

**Start the server:**
```bash
cd server
npm start
```

The application will be available at:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

## 📁 Project Structure

```
Chat-Application/
├── client/                 # React frontend
│   ├── src/
│   │   ├── assets/        # Images and static files
│   │   ├── components/    # React components
│   │   │   ├── ChatContainer.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   ├── VideoCall.jsx
│   │   │   └── ...
│   │   ├── context/       # React context providers
│   │   │   ├── AppContext.jsx
│   │   │   └── ChatContext.jsx
│   │   ├── pages/         # Page components
│   │   │   ├── HomePage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── SignupPage.jsx
│   │   │   └── ...
│   │   ├── utils/         # Utility functions
│   │   │   └── encryption.js
│   │   ├── App.jsx        # Main app component
│   │   └── main.jsx       # Entry point
│   ├── package.json
│   └── vite.config.js
│
├── server/                # Node.js backend
│   ├── controller/        # Route controllers
│   │   ├── authController.js
│   │   └── messageController.js
│   ├── models/            # Mongoose models
│   │   ├── userModel.js
│   │   └── messageModel.js
│   ├── routes/            # API routes
│   │   ├── authRoutes.js
│   │   └── messageRoutes.js
│   ├── lib/               # Libraries and configs
│   │   ├── auth.js
│   │   └── cloudinary.js
│   ├── mailtrap/          # Email templates
│   │   ├── emailTemplate.js
│   │   └── mailtrap.config.js
│   ├── utils/             # Utility functions
│   │   └── encryption.js
│   ├── server.js          # Server entry point
│   ├── config.env         # Environment variables
│   └── package.json
│
├── .gitignore
├── package.json
└── README.md
```

## 🔒 Encryption

The application uses **AES-128-CBC encryption** for all messages:

- **Algorithm**: AES-128-CBC
- **Key Derivation**: SHA-256 hash of sorted user IDs
- **Key Size**: 128 bits
- **IV**: Random 128-bit initialization vector per message
- **Mode**: CBC (Cipher Block Chaining)

Messages are encrypted on the client before sending and decrypted after receiving, ensuring end-to-end encryption.

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/verify-email` - Verify email
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password
- `GET /api/auth/check-auth` - Check authentication status
- `PUT /api/auth/update-profile` - Update user profile

### Messages
- `GET /api/messages/users` - Get all users with last messages
- `GET /api/messages/:id` - Get messages with specific user
- `POST /api/messages/send/:id` - Send message to user
- `PUT /api/messages/mark/:id` - Mark message as seen

### Socket Events
- `newMessage` - New message received
- `video-call-initiate` - Initiate video call
- `video-call-incoming` - Incoming video call
- `video-call-accept` - Accept video call
- `video-call-reject` - Reject video call
- `video-call-end` - End video call
- `video-call-offer` - WebRTC offer
- `video-call-answer` - WebRTC answer
- `video-call-ice-candidate` - ICE candidate exchange

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Arnav**
- GitHub: [@ArnavT27](https://github.com/ArnavT27)

## 🙏 Acknowledgments

- Socket.IO for real-time communication
- Cloudinary for image hosting
- Mailtrap for email testing
- The MERN stack community
  
---

Made with ❤️ using the MERN Stack
