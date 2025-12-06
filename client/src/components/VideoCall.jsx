import React, { useEffect, useRef, useState, useContext } from "react";
import { X, PhoneOff, Mic, MicOff, Video as VideoIcon, VideoOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import AppContext from "../context/AppContext";
import { ChatContext } from "../context/ChatContext";

const VideoCall = ({ isOpen, onClose, isIncoming = false, callerInfo = null }) => {
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callStatus, setCallStatus] = useState(isIncoming ? "incoming" : "calling");
  const [peerConnection, setPeerConnection] = useState(null);
  
  const { socket } = useContext(AppContext);
  const { selectedUser } = useContext(ChatContext);
  
  const targetUser = isIncoming ? callerInfo : selectedUser;

  // Reset call status when isIncoming changes
  useEffect(() => {
    if (isOpen) {
      setCallStatus(isIncoming ? "incoming" : "calling");
    }
  }, [isIncoming, isOpen]);

  // WebRTC Configuration
  const configuration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ],
  };

  // Initialize peer connection
  useEffect(() => {
    if (!isOpen || !socket || !targetUser) return;

    const pc = new RTCPeerConnection(configuration);

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("video-call-ice-candidate", {
          targetUserId: targetUser._id,
          candidate: event.candidate,
        });
      }
    };

    // Handle remote stream
    pc.ontrack = (event) => {
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    setPeerConnection(pc);

    return () => {
      if (pc) {
        pc.close();
      }
    };
  }, [isOpen, socket, targetUser?._id]);

  // Get user media
  useEffect(() => {
    if (!isOpen) return;

    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Tracks will be added in a separate useEffect when peerConnection is ready
      } catch (error) {
        console.error("Error accessing media devices:", error);
        alert("Could not access camera/microphone. Please check permissions.");
        handleEndCall();
      }
    };

    // Get media immediately for outgoing calls, wait for accept for incoming calls
    if (!isIncoming) {
      getMedia();
    } else if (isIncoming && callStatus === "connected") {
      getMedia();
    }

    return () => {
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen, peerConnection, isIncoming, callStatus]);

  // Add tracks to peer connection when both are ready
  useEffect(() => {
    if (!isOpen) return;
    
    if (peerConnection && localStream && peerConnection.signalingState !== 'closed') {
      try {
        const tracks = localStream.getTracks();
        tracks.forEach((track) => {
          // Check if track is still live and connection is still open
          if (track.readyState === 'live' && peerConnection.signalingState !== 'closed') {
            const existingSender = peerConnection.getSenders().find(
              (sender) => sender.track === track
            );
            if (!existingSender) {
              peerConnection.addTrack(track, localStream);
            }
          }
        });
      } catch (error) {
        // Ignore errors if connection is already closed
        if (error.name !== 'InvalidStateError') {
          console.error("Error adding tracks to peer connection:", error);
        }
      }
    }
  }, [peerConnection, localStream, isOpen]);

  // Create offer for outgoing calls after tracks are added
  useEffect(() => {
    if (!isIncoming && callStatus === "connected" && peerConnection && localStream && socket && targetUser) {
      if (peerConnection.signalingState === 'closed') {
        return;
      }
      const createOffer = async () => {
        try {
          if (peerConnection.signalingState !== 'closed') {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            socket.emit("video-call-offer", {
              targetUserId: targetUser._id,
              offer: offer,
            });
          }
        } catch (error) {
          console.error("Error creating offer:", error);
        }
      };
      createOffer();
    }
  }, [isIncoming, callStatus, peerConnection, localStream, socket, targetUser]);

  // Socket event handlers
  useEffect(() => {
    if (!socket || !isOpen) return;

    const handleCallAccepted = async () => {
      setCallStatus("connected");
    };

    const handleCallRejected = () => {
      setCallStatus("rejected");
      setTimeout(() => {
        handleEndCall();
      }, 2000);
    };

    const handleCallEnded = () => {
      handleEndCall();
    };

    const handleOffer = async (data) => {
      if (isIncoming && peerConnection && peerConnection.signalingState !== 'closed') {
        try {
          await peerConnection.setRemoteDescription(data.offer);
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          socket.emit("video-call-answer", {
            targetUserId: data.fromUserId,
            answer: answer,
          });
          setCallStatus("connected");
        } catch (error) {
          console.error("Error handling offer:", error);
        }
      }
    };

    const handleAnswer = async (data) => {
      if (!isIncoming && peerConnection && peerConnection.signalingState !== 'closed') {
        try {
          await peerConnection.setRemoteDescription(data.answer);
        } catch (error) {
          console.error("Error handling answer:", error);
        }
      }
    };

    const handleIceCandidate = async (data) => {
      if (peerConnection && data.candidate && peerConnection.signalingState !== 'closed') {
        try {
          await peerConnection.addIceCandidate(data.candidate);
        } catch (error) {
          console.error("Error adding ICE candidate:", error);
        }
      }
    };

    socket.on("video-call-accepted", handleCallAccepted);
    socket.on("video-call-rejected", handleCallRejected);
    socket.on("video-call-ended", handleCallEnded);
    socket.on("video-call-offer", handleOffer);
    socket.on("video-call-answer", handleAnswer);
    socket.on("video-call-ice-candidate", handleIceCandidate);

    return () => {
      socket.off("video-call-accepted", handleCallAccepted);
      socket.off("video-call-rejected", handleCallRejected);
      socket.off("video-call-ended", handleCallEnded);
      socket.off("video-call-offer", handleOffer);
      socket.off("video-call-answer", handleAnswer);
      socket.off("video-call-ice-candidate", handleIceCandidate);
    };
  }, [socket, isOpen, isIncoming, peerConnection, targetUser?._id]);

  const handleEndCall = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
      setLocalStream(null);
    }
    if (peerConnection && peerConnection.signalingState !== 'closed') {
      try {
        peerConnection.close();
      } catch (error) {
        console.error("Error closing peer connection:", error);
      }
      setPeerConnection(null);
    }
    if (socket && targetUser) {
      socket.emit("video-call-end", { targetUserId: targetUser._id });
    }
    setRemoteStream(null);
    setCallStatus("ended");
    setTimeout(() => {
      onClose();
    }, 1000);
  };

  const handleAcceptCall = () => {
    if (socket && callerInfo) {
      socket.emit("video-call-accept", { callerId: callerInfo._id });
      setCallStatus("connected");
    }
  };

  const handleRejectCall = () => {
    if (socket && callerInfo) {
      socket.emit("video-call-reject", { callerId: callerInfo._id });
    }
    handleEndCall();
  };

  const toggleMute = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  // Debug props
  useEffect(() => {
    console.log("VideoCall component props:", {
      isOpen,
      isIncoming,
      callerInfo,
      callStatus,
    });
  }, [isOpen, isIncoming, callerInfo, callStatus]);

  console.log("VideoCall: Rendering, isOpen =", isOpen);

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <motion.div
          key="video-call"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="fixed inset-0 z-[9999] flex flex-col bg-black/90 backdrop-blur-sm"
        >
          {/* Remote Video */}
          <div className="flex-1 relative bg-gray-900">
            {remoteStream ? (
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="relative w-32 h-32 mx-auto mb-4">
                    {callStatus === "incoming" && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-4 border-emerald-500"
                        animate={{ scale: [1, 1.2, 1], opacity: [0.8, 0, 0.8] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    )}
                    <div className="relative w-32 h-32 bg-gradient-to-br from-emerald-500/20 to-green-500/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/10">
                      <img
                        src={targetUser?.profilePic || "/avatar.png"}
                        alt={targetUser?.fullName}
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    </div>
                  </div>
                  <h3 className="text-2xl font-semibold text-white mb-2">
                    {targetUser?.fullName}
                  </h3>
                  <p className="text-gray-300">
                    {callStatus === "calling" && "Calling..."}
                    {callStatus === "incoming" && (
                      <span className="flex items-center justify-center gap-2">
                        <motion.span
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                          className="inline-block"
                        >
                          Incoming call...
                        </motion.span>
                      </span>
                    )}
                    {callStatus === "connected" && "Connecting..."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Local Video */}
          <div className="absolute top-4 right-4 w-48 h-36 rounded-lg overflow-hidden border-2 border-emerald-500 shadow-lg bg-gray-800">
            {localStream ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <VideoIcon className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>

          {/* Call Controls */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            {callStatus === "incoming" ? (
              <div className="flex space-x-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleRejectCall}
                  className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-lg"
                >
                  <PhoneOff className="w-6 h-6" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleAcceptCall}
                  className="p-4 bg-emerald-500 text-white rounded-full hover:bg-emerald-600 transition-all shadow-lg"
                >
                  <VideoIcon className="w-6 h-6" />
                </motion.button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleMute}
                  className={`p-4 rounded-full transition-all shadow-lg ${
                    isMuted
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                  }`}
                >
                  {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleVideo}
                  className={`p-4 rounded-full transition-all shadow-lg ${
                    isVideoOff
                      ? "bg-red-500 hover:bg-red-600 text-white"
                      : "bg-white/20 hover:bg-white/30 text-white backdrop-blur-sm"
                  }`}
                >
                  {isVideoOff ? <VideoOff className="w-6 h-6" /> : <VideoIcon className="w-6 h-6" />}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleEndCall}
                  className="p-4 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-lg"
                >
                  <PhoneOff className="w-6 h-6" />
                </motion.button>
              </div>
            )}
          </div>

          {/* Close Button */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleEndCall}
            className="absolute top-4 left-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-sm transition-all"
          >
            <X className="w-5 h-5" />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VideoCall;

