import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Mail, Lock, Loader } from "lucide-react";
import { Link } from "react-router-dom";
import Input from "../components/Input";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { notification } from "antd";
import AppContext from "../context/AppContext";
import { useContext } from "react";

const URL = import.meta.env.VITE_BACKEND_URL;
const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  const navigate = useNavigate();
  const [api, context] = notification.useNotification();
  const {
    isLoading,
    setIsLoading,
    isAuthenticated,
    setIsAuthenticated,
    user,
    setUser,
    setError,
    connectSocket,
  } = useContext(AppContext);
  const handleLogin = async (e) => {
    e.preventDefault();
    // axios.defaults.withCredentials = true;
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${URL}/api/auth/login`,
        { email, password },
        { withCredentials: true }
      );

      if (response.data.status === "success") {
        setUser(response.data.user);
        setIsAuthenticated(true);
        connectSocket(response.data.user);
        api.success({
          message: "Success",
          description: "Logged in successfully!!",
        });
        navigate("/");
        console.log(response);
      }
    } catch (err) {
      console.log(err);
      const description = err.response?.data?.message || "Login failed";
      setError(description);
      api.error({
        message: "Error",
        description,
      });
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    if (user && isAuthenticated) {
      navigate("/");
    }
  });

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
            Welcome Back
          </h2>
          <p className="text-center text-gray-300 mb-8 text-sm">
            Sign in to continue to your account
          </p>

          <form onSubmit={handleLogin}>
            <div className="space-y-4">
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
            </div>

            <div className="flex items-center justify-between mt-3 mb-6">
              <span className="text-xs text-gray-400">
                Use your registered credentials
              </span>
              <Link
                to="/forgot-password"
                className="text-sm text-green-400 hover:text-green-300 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            {/* {error && <p className='text-red-500 font-semibold mb-2'>{error}</p>} */}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-black transition duration-200"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader className="w-6 h-6 animate-spin mx-auto" />
              ) : (
                "Login"
              )}
            </motion.button>
          </form>
        </div>
        <div className="px-8 sm:px-10 py-4 bg-black/30 border-t border-white/10 flex justify-center">
          <p className="text-sm text-gray-300">
            Don't have an account?{" "}
            <Link
              to="/signup"
              className="text-green-400 hover:text-green-300 transition-colors"
            >
              Sign up
            </Link>
          </p>
        </div>
        {context}
      </motion.div>
    </div>
  );
};
export default LoginPage;
