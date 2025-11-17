import React, { useState, useRef, useEffect, useContext } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  CheckCircle,
  ArrowLeft,
  AlertCircle,
  Loader,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { notification } from "antd";
import AppContext from "../context/AppContext";
const URL = import.meta.env.VITE_BACKEND_URL;

const EmailVerificationPage = () => {
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const [api, context] = notification.useNotification();
  const {user,isAuthenticated}=useContext(AppContext);
  const handleOtpChange = (index, value) => {
    if (value.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (!value && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split("");
      setOtp([...newOtp, ...Array(6 - newOtp.length).fill("")]);
      inputRefs.current[5]?.focus();
    }
  };

  const handleVerify = async () => {
    const otpString = otp.join("");
    if (otpString.length !== 6) {
      setError("Please enter a complete 6-digit code");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post(
        `${URL}/api/auth/verify-email`,
        {
          code: otpString,
        },
        { withCredentials: true }
      );

      if (response.data.status === "success") {
        setSuccess(true);
        api.success({
          message: "Success",
          description: "Email Verified!!",
        });
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    } catch (err) {
      api.error({
        message: "Error",
        description: "Verification failed. Please try again.",
        placement: "topRight",
      });
      setError(
        err.response?.data?.message || "Verification failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(()=>{
    if(!isAuthenticated){
      navigate('/login');
    }
    else if(user && user.isVerified && isAuthenticated){
      navigate('/home');
    }
  },[user,isAuthenticated])
  // console.log(isAuthenticated);
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-green-400/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative max-w-md w-[92%] sm:w-full bg-white/10 backdrop-blur-2xl rounded-2xl shadow-2xl ring-1 ring-white/10 border border-white/10 overflow-hidden z-10"
      >
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
              className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4"
            >
              <Mail className="w-8 h-8 text-white" />
            </motion.div>

            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-2xl font-bold mb-2 bg-gradient-to-r from-green-400 to-emerald-500 text-transparent bg-clip-text"
            >
              Verify Your Email
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-gray-400"
            >
              We've sent a 6-digit verification code to your email address
            </motion.p>
          </div>

          {/* Success Message */}
          {success && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center space-x-3"
            >
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-green-400">
                Email verified successfully! Redirecting...
              </span>
            </motion.div>
          )}

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center space-x-3"
            >
              <AlertCircle className="w-5 h-5 text-red-400" />
              <span className="text-red-400">{error}</span>
            </motion.div>
          )}

          {/* OTP Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mb-6"
          >
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Enter Verification Code
            </label>
            <div className="flex space-x-3 justify-center">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  maxLength="1"
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-12 text-center text-lg font-semibold bg-gray-900/50 border border-white/10 rounded-lg focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/20 focus:outline-none transition-all duration-200 text-white"
                  disabled={isLoading || success}
                />
              ))}
            </div>
          </motion.div>

          {/* Verify Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            onClick={handleVerify}
            disabled={isLoading || success || otp.join("").length !== 6}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-black transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          >
            {isLoading ? (
              <Loader className="mx-auto animate-spin size={24}" />
            ) : (
              "Verify Email"
            )}
          </motion.button>

          {/* Resend Code */}
          {/* <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="text-center"
          >
            <p className="text-sm text-gray-400 mb-2">
              Didn't receive the code?
            </p>
            <button
              onClick={handleResend}
              disabled={resendTimer > 0 || isLoading}
              className="text-sm text-green-400 hover:text-green-300 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors"
            >
              {resendTimer > 0 
                ? `Resend in ${resendTimer}s` 
                : 'Resend Code'
              }
            </button>
          </motion.div> */}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-black/30 border-t border-white/10 flex justify-center">
          <Link
            to="/login"
            className="flex items-center space-x-2 text-sm text-gray-300 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Login</span>
          </Link>
        </div>
      </motion.div>
      {context}
    </div>
  );
};

export default EmailVerificationPage;
