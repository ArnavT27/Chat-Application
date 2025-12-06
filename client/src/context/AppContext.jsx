import React, { createContext, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { getCookie } from "../utils/cookies";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
const AppContext = createContext();
const backendUrl = import.meta.env.VITE_BACKEND_URL;
axios.defaults.baseURL = backendUrl;
axios.defaults.withCredentials = true;

// Provider component
export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [socket, setSocket] = useState(null);
  const [token, setToken] = useState(getCookie("token"));
  const [isVideoCallActive, setIsVideoCallActive] = useState(false);
  const [videoCallData, setVideoCallData] = useState(null);
  const navigate = useNavigate();
  useEffect(() => {
    checkAuthStatus();
  }, []);
  const connectSocket = useCallback((userData) => {
    if (socket?.connected || !userData) {
      if (socket?.connected) {
        console.log("Socket already connected, skipping connection");
      }
      return;
    }

    console.log("Connecting socket for user:", userData._id);
    const newSocket = io(backendUrl, {
      query: {
        userId: userData._id,
      },
    });
    
    newSocket.on("connect", () => {
      console.log("Socket connected with ID:", newSocket.id);
      console.log("Socket query userId:", userData._id);
    });
    
    newSocket.on("connect_error", (error) => {
      console.error("Socket connection error:", error);
    });
    
    newSocket.connect();
    setSocket(newSocket);
    newSocket.on("getOnlineUsers", (userIds) => {
      console.log("Online users received:", userIds);
      setOnlineUsers(userIds);
    });
  }, [socket]);

  // Set up incoming call listener whenever socket changes
  useEffect(() => {
    if (!socket) {
      console.log("Socket not available for video call listener");
      return;
    }

    console.log("Setting up video call listener on socket:", socket.id);
    console.log("Socket connected:", socket.connected);
    
    const handleIncomingCall = (data) => {
      console.log("\n=== INCOMING VIDEO CALL RECEIVED ===");
      console.log("Call data received:", data);
      console.log("Caller:", data.caller);
      
      if (data.caller) {
        console.log("Setting video call data and activating call screen");
        
        // Set both states - React will batch these updates
        console.log("Setting videoCallData to:", data.caller);
        setVideoCallData(data.caller);
        
        console.log("Setting isVideoCallActive to true");
        setIsVideoCallActive(true);
        
        console.log("✓ State updates queued - incoming call screen should now be visible\n");
      } else {
        console.error("✗ No caller data in incoming call event");
      }
    };

    // Set up listener when socket connects
    const setupListener = () => {
      console.log("Socket connected, setting up video call listener");
      socket.off("video-call-incoming", handleIncomingCall);
      socket.on("video-call-incoming", handleIncomingCall);
      console.log("✓ Video call listener registered");
    };

    if (socket.connected) {
      setupListener();
    } else {
      socket.on("connect", setupListener);
    }

    return () => {
      console.log("Cleaning up video call listener");
      socket.off("video-call-incoming", handleIncomingCall);
      socket.off("connect", setupListener);
    };
  }, [socket]);

  // Debug state changes
  useEffect(() => {
    console.log("AppContext - isVideoCallActive changed to:", isVideoCallActive);
  }, [isVideoCallActive]);

  useEffect(() => {
    console.log("AppContext - videoCallData changed to:", videoCallData);
  }, [videoCallData]);

  // Check if user is authenticated on app load
  const checkAuthStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const cookieToken = getCookie("token");
      setToken(cookieToken);

      if (!cookieToken) {
        navigate("/login");
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      // Token is sent via cookie; no need to set a header

      // Verify token with server
      const response = await axios.get('/api/auth/check-auth', {
        withCredentials: true,
      });
      if (response.data.status === "success") {
        setUser(response.data.user);
        setIsAuthenticated(true);
        navigate("/");
        // Establish socket connection after successful auth
        connectSocket(response.data.user);
      } else {
        setIsAuthenticated(false);
        setUser(null);
      }
    } catch (err) {
      console.error("Auth check failed:", err);
      setIsAuthenticated(false);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [navigate, connectSocket]);
  const updateProfile=async(body)=>{
    try{
      const response=await axios.put('/api/auth/update-profile',body,{withCredentials:true});
      if(response.data.status==='success'){
        console.log('Profile updated successfully:', response.data);
        setUser(response.data.user);
      }
    }
    catch(err){
      console.error("Update Profile failed:", err.response?.data || err.message);
      throw err; // Re-throw to let ProfilePage handle the error
    }
  }
  

  // Get user data
  const getUser = () => {
    return user;
  };

  // Check if user is verified
  const isUserVerified = () => {
    return user?.isVerified || false;
  };

  // Context value
  const value = {
    // State
    user,
    isAuthenticated,
    isLoading,
    error,
    onlineUsers,
    socket,
    axios,
    token,
    isVideoCallActive,
    videoCallData,

    setIsLoading,
    setUser,
    setIsAuthenticated,
    setError,
    setOnlineUsers,
    setSocket,
    setToken,
    setIsVideoCallActive,
    setVideoCallData,

    // Functions

    checkAuthStatus,
    updateProfile,
    getUser,
    isUserVerified,
    
    connectSocket,
    // Utility functions
    hasToken: () => {
      const cookies = document.cookie.split(";");
      return cookies.some((cookie) => cookie.trim().startsWith("token="));
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext;
