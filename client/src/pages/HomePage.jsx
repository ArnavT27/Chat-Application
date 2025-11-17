import React, { useContext, useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatContainer from "../components/ChatContainer";
import RightSidebar from "../components/RightSidebar";
import AppContext from "../context/AppContext";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const [selectedUser, setSelectedUser] = useState(null);
  const { user, isAuthenticated } = useContext(AppContext);
  const [currentUserId] = useState("680f50aaf10f3cd28382ecf2");
  const navigate = useNavigate();
  useEffect(() => {
    if (!user || !isAuthenticated) {
      navigate("/login");
    }
  });
  return (
    <div className="h-screen">
      <div className="flex h-full">
        <Sidebar
          setSelectedUser={setSelectedUser}
          selectedUser={selectedUser}
          currentUserId={currentUserId}
        />
        <ChatContainer
          setSelectedUser={setSelectedUser}
          selectedUser={selectedUser}
          currentUserId={currentUserId}
        />
        <RightSidebar
          setSelectedUser={setSelectedUser}
          selectedUser={selectedUser}
        />
      </div>
    </div>
  );
};

export default HomePage;
