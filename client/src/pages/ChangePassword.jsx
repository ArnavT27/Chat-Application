import React, { useContext, useState } from 'react'
import {Lock,Loader} from 'lucide-react'
import { motion } from 'framer-motion';
import Input from '../components/Input';
import { notification } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import AppContext from '../context/AppContext';
const URL = import.meta.env.VITE_BACKEND_URL;
const ChangePasswordPage = () => {
    const [password,setPassword]=useState('');
    const [passwordConfirm,setPasswordConfirm]=useState('');
    const [isLoading,setIsLoading]=useState(false);
    const [api,context]=notification.useNotification();

    const {token}=useParams();
    const {setIsAuthenticated}=useContext(AppContext);
    const navigate=useNavigate();
    async function handleChange(e){
        e.preventDefault();
        setIsLoading(true);
        try{
            const response=await axios.post(`${URL}/api/auth/forgot-password/${token}`,{password,passwordConfirm});
            console.log(response);
            setIsAuthenticated(false);
            navigate('/login');
        }
        catch(err){
            api.error({
                message:"Error",
                description:err.response.data.message,
            })
        }
        finally{
            setIsLoading(false);
        }
    }
  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
        <div className="pointer-events-none absolute -top-24 -left-24 h-72 w-72 rounded-full bg-emerald-600/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-green-400/20 blur-3xl" />
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="relative w-[92%] max-w-md"
        >
            <div className="relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-2xl shadow-2xl ring-1 ring-white/10 border border-white/10">                    
                <div className="relative p-8 sm:p-10">
                    <div className="text-center mb-8">
                        <h1 className="bg-gradient-to-r from-green-400 via-emerald-400 to-green-600 text-transparent bg-clip-text text-3xl sm:text-4xl font-extrabold mb-2">
                            Change Password
                        </h1>
                    </div>
                    <form onSubmit={handleChange}  className="space-y-6">
                        <div className="space-y-2">
                            <Input 
                                icon={Lock} 
                                type="password" 
                                placeholder="Enter your password"
                                required
                                onChange={(e)=>setPassword(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Input 
                                icon={Lock} 
                                type="password" 
                                placeholder="Confirm Password"
                                required
                                onChange={(e)=>setPasswordConfirm(e.target.value)}
                            />
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            className="w-full py-3.5 px-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold rounded-xl shadow-lg hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-black transition-all duration-200 transform hover:shadow-xl"
                            type="submit"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <div className="flex items-center justify-center space-x-2">
                                    <Loader className="w-5 h-5 animate-spin" />
                                    <span>Updating...</span>
                                </div>
                            ) : (
                                "Confirm"
                            )}
                        </motion.button>
                    </form>
                    <div className="mt-6 text-center">
                        <motion.a
                            href="/login"
                            whileHover={{ scale: 1.05 }}
                            className="text-gray-300 hover:text-green-300 text-sm transition-colors duration-200"
                        >
                            ← Back to Login
                        </motion.a>
                    </div>
                </div>
            </div>
            {context}
        </motion.div>
    </div>
  )
}

export default ChangePasswordPage