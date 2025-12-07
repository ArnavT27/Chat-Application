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
  const [pendingOffer, setPendingOffer] = useState(null); // Store offer until user accepts
  
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
      console.log("Received remote track:", event.track.kind);
      const stream = event.streams[0];
      console.log("Remote stream tracks:", stream.getTracks().map(t => t.kind));
      setRemoteStream(stream);
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
        console.log("Getting user media...");
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        console.log("Got media stream:", stream);
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

    // Get media immediately for both incoming and outgoing calls
    // This ensures the receiver has their camera ready when they accept
    if (!localStream) {
      getMedia();
    }

    return () => {
      // Don't cleanup here, let handleEndCall do it
    };
  }, [isOpen, localStream]);

  // Add tracks to peer connection when both are ready
  useEffect(() => {
    if (!isOpen) return;
    
    if (peerConnection && localStream && peerConnection.signalingState !== 'closed') {
      try {
        const tracks = localStream.getTracks();
        console.log("Adding local tracks to peer connection:", tracks.map(t => t.kind));
        tracks.forEach((track) => {
          // Check if track is still live and connection is still open
          if (track.readyState === 'live' && peerConnection.signalingState !== 'closed') {
            const existingSender = peerConnection.getSenders().find(
              (sender) => sender.track === track
            );
            if (!existingSender) {
              console.log(`Adding ${track.kind} track to peer connection`);
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

  // Update remote video element when remote stream changes
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      console.log("Setting remote video srcObject");
      remoteVideoRef.current.srcObject = remoteStream;
      
      // Force play in case autoplay doesn't work
      remoteVideoRef.current.play().catch(err => {
        console.error("Error playing remote video:", err);
      });
    }
  }, [remoteStream]);

  // Create offer for outgoing calls after tracks are added
  useEffect(() => {
    // Only create offer if we're the caller (not incoming) and we have everything ready
    if (!isIncoming && peerConnection && localStream && socket && targetUser && callStatus === "calling") {
      if (peerConnection.signalingState === 'closed') {
        return;
      }
      
      // Wait a bit for tracks to be added
      const timer = setTimeout(async () => {
        try {
          if (peerConnection.signalingState !== 'closed' && peerConnection.signalingState !== 'have-local-offer') {
            console.log("Creating offer...");
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            console.log("Sending offer to receiver");
            socket.emit("video-call-offer", {
              targetUserId: targetUser._id,
              offer: offer,
            });
          }
        } catch (error) {
          console.error("Error creating offer:", error);
        }
      }, 500);
      
      return () => clearTimeout(timer);
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
      console.log("Received offer from caller");
      // Store the offer but don't process it until user accepts the call
      if (isIncoming) {
        console.log("Storing offer for incoming call - waiting for user to accept");
        setPendingOffer(data);
      }
    };

    const handleAnswer = async (data) => {
      console.log("Received answer from receiver");
      if (peerConnection && peerConnection.signalingState !== 'closed') {
        try {
          console.log("Setting remote description (answer)");
          await peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
          setCallStatus("connected");
          console.log("Connection established!");
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

  const handleAcceptCall = async () => {
    console.log("Accepting call...");
    
    // Make sure we have local stream before accepting
    let streamToUse = localStream;
    if (!streamToUse) {
      console.log("Waiting for local stream...");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);
        streamToUse = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error getting media:", error);
        alert("Could not access camera/microphone");
        return;
      }
    }
    
    if (socket && callerInfo && peerConnection) {
      // Add tracks to peer connection first
      if (streamToUse && peerConnection.signalingState !== 'closed') {
        const tracks = streamToUse.getTracks();
        console.log("Adding tracks before processing offer:", tracks.map(t => t.kind));
        tracks.forEach((track) => {
          if (track.readyState === 'live') {
            const existingSender = peerConnection.getSenders().find(
              (sender) => sender.track === track
            );
            if (!existingSender) {
              console.log(`Adding ${track.kind} track to peer connection`);
              peerConnection.addTrack(track, streamToUse);
            }
          }
        });
      }
      
      console.log("Emitting video-call-accept");
      socket.emit("video-call-accept", { callerId: callerInfo._id });
      
      // Wait a bit for tracks to be fully added, then process the pending offer
      setTimeout(async () => {
        if (pendingOffer && peerConnection && peerConnection.signalingState !== 'closed') {
          try {
            console.log("Processing pending offer after user accepted");
            console.log("Setting remote description (offer)");
            await peerConnection.setRemoteDescription(new RTCSessionDescription(pendingOffer.offer));
            console.log("Creating answer");
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            console.log("Sending answer back to caller");
            socket.emit("video-call-answer", {
              targetUserId: pendingOffer.fromUserId,
              answer: answer,
            });
            setCallStatus("connected");
            setPendingOffer(null); // Clear pending offer
          } catch (error) {
            console.error("Error handling offer after accept:", error);
          }
        }
      }, 300);
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
    console.log("VideoCall component mounted/updated with props:", {
      isOpen,
      isIncoming,
      callerInfo,
      callStatus,
      targetUser,
    });
  }, [isOpen, isIncoming, callerInfo, callStatus, targetUser]);
  
  useEffect(() => {
    if (isOpen) {
      console.log("🎥 VideoCall is OPEN - component should be visible!");
    }
  }, [isOpen]);

  console.log("VideoCall: Rendering, isOpen =", isOpen, "isIncoming =", isIncoming);

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
                muted={false}
                className="w-full h-full object-cover"
                onLoadedMetadata={() => console.log("Remote video metadata loaded")}
                onPlay={() => console.log("Remote video playing")}
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

