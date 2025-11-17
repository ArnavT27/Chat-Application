const router=require("express").Router();
const authController=require('./../controller/authController.js');
const {protectRoute} =require('../lib/auth.js');
router.get('/check-auth',authController.verifyToken,authController.checkAuth);
router.post("/login",authController.login);
router.post("/signup",authController.signup);
router.post("/logout",authController.logout);
router.post('/verify-email',authController.verifyToken,authController.verifyEmail);
router.post('/forgot-password',authController.forgotPassword);
router.post('/forgot-password/:token',authController.resetPassword);
router.put('/update-profile',authController.verifyToken,authController.updateProfile)
module.exports=router;