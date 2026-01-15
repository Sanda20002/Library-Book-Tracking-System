const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');

// Register new member
router.post('/register', memberController.registerMember);

// Get all members
router.get('/', memberController.getAllMembers);

// Search members
router.get('/search', memberController.searchMembers);

// Get member by email
router.get('/email/:email', memberController.getMemberByEmail);

// Get single member
router.get('/:id', memberController.getMemberById);

// Update member
router.put('/:id', memberController.updateMember);

// Delete member
router.delete('/:id', memberController.deleteMember);

module.exports = router;