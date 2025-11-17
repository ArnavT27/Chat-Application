const router=require('express').Router();

const { protectRoute } = require('../lib/auth');

const {getUsersforSidebar,getMessages,markMessageAsSeen, sendMessage}=require('../controller/messageController');

router.get('/users',protectRoute,getUsersforSidebar);
router.get('/:id',protectRoute,getMessages);
router.patch('/mark/:id',protectRoute,markMessageAsSeen);
router.post('/send/:id',protectRoute,sendMessage);
module.exports=router;