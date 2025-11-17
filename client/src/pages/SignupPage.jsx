import React, { useContext, useEffect, useState } from "react";
import { motion } from "framer-motion";
import Input from "../components/Input";
import { User, Mail, Lock, Loader } from "lucide-react";
import { Link } from "react-router-dom";
import PasswordStrengthMeter from "../components/PasswordStrength";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { notification } from "antd";
import AppContext from "../context/AppContext";
const URL = import.meta.env.VITE_BACKEND_URL;

const SignupPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const navigate = useNavigate();
  const [api, context] = notification.useNotification();
  const {
    user,
    isAuthenticated,
    setUser,
    setIsAuthenticated,
    isLoading,
    setIsLoading,
  } = useContext(AppContext);
  async function handleSignup(e) {
    e.preventDefault();
    axios.defaults.withCredentials = true;
    let response;
    try {
      setIsLoading(true);
      response = await axios.post(`${URL}/api/auth/signup`, {
        fullName: name,
        email,
        password,
        passwordConfirm,
      });
      if (response.data.status === "success") {
        setUser(response.data.data.user);
        setIsAuthenticated(true);
        navigate("/verify-email");
      }
    } catch (err) {
      api.error({
        message: "Error",
        description: err.response?.data?.message,
      });
      setIsLoading(false);
    } finally {
      if (response.data.status === "success") {
        api.success({
          message: "Success",
        });
      }
      setIsLoading(false);
    }
  }
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate("/home");
    }
  }, [isAuthenticated, user]);
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
      <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-green-400/20 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative max-w-md w-[92%] sm:w-full bg-white/10 backdrop-blur-2xl rounded-2xl shadow-2xl ring-1 ring-white/10 border border-white/10 overflow-hidden"
      >
        <div className="p-8 sm:p-10">
          <h2 className="text-3xl sm:text-4xl font-extrabold mb-2 text-center bg-gradient-to-r from-green-400 to-emerald-500 text-transparent bg-clip-text">
            Create Account
          </h2>
          <p className="text-center text-gray-300 mb-8 text-sm">
            Join us to start messaging securely
          </p>
          <form onSubmit={handleSignup}>
            <div className="space-y-4">
              <Input
                icon={User}
                type="text"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                icon={Mail}
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <Input
                icon={Lock}
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <Input
                icon={Lock}
                type="password"
                placeholder="Confirm Password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
              />
            </div>
            <div className="mt-2">
              <PasswordStrengthMeter password={password} />
            </div>
            <motion.button
              className="mt-5 w-full py-3.5 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-black transition duration-200"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              onClick={handleSignup}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader className=" animate-spin mx-auto" size={24} />
              ) : (
                "Sign Up"
              )}
            </motion.button>
          </form>
        </div>
        <div className="px-8 sm:px-10 py-4 bg-black/30 border-t border-white/10 flex justify-center">
          <p className="text-sm text-gray-300">
            Already have an account?{" "}
            <Link
              to={"/login"}
              className="text-green-400 hover:text-green-300 transition-colors"
            >
              Login
            </Link>
          </p>
        </div>
        {context}
      </motion.div>
    </div>
  );
};

export default SignupPage;
