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
  const navigate = useNavigate();
  useEffect(() => {
    checkAuthStatus();
  }, []);
  const connectSocket = useCallback((userData) => {
    if (socket?.connected || !userData) return;

    const newSocket = io(backendUrl, {
      query: {
        userId: userData._id,
      },
    });
    newSocket.connect();
    setSocket(newSocket);
    newSocket.on("getOnlineUsers", (userIds) => {
      setOnlineUsers(userIds);
    });
  }, [socket]);

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

    setIsLoading,
    setUser,
    setIsAuthenticated,
    setError,
    setOnlineUsers,
    setSocket,
    setToken,

    // Functions

    checkAuthStatus,
    updateProfile,
    getUser,
    isUserVerified,
    

    // Utility functions
    hasToken: () => {
      const cookies = document.cookie.split(";");
      return cookies.some((cookie) => cookie.trim().startsWith("token="));
    },
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export default AppContext;
