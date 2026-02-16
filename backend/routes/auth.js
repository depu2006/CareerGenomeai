const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'career-genome-secret-key-123';

// In-Memory User Store for Demo Mode
const users = [];

// @route   POST /api/auth/signup
// @desc    Register a new user
router.post('/signup', async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (global.HAS_DB) {
            // MongoDB Logic
            let user = await User.findOne({ email });
            if (user) return res.status(400).json({ msg: 'User already exists' });

            user = new User({ name, email, password });
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(password, salt);
            await user.save();
            return sendToken(user, res);
        } else {
            // Demo Mode Logic
            if (users.find(u => u.email === email)) {
                return res.status(400).json({ msg: 'User already exists (Demo Mode)' });
            }
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);
            const newUser = { id: Date.now(), name, email, password: hashedPassword };
            users.push(newUser);
            return sendToken(newUser, res);
        }
    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ msg: 'Server error during login', error: err.message });
    }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        let user;

        if (global.HAS_DB) {
            user = await User.findOne({ email });
        } else {
            user = users.find(u => u.email === email);
            // Add a default user for testing if users array is empty
            if (!user && email === 'demo@example.com') {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash('password', salt);
                user = { id: 1, name: 'Demo User', email: 'demo@example.com', password: hashedPassword };
                users.push(user);
            }
        }

        if (!user) return res.status(400).json({ msg: 'Invalid Credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'Invalid Credentials' });

        return sendToken(user, res);

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ msg: 'Server error during login', error: err.message });
    }
});

function sendToken(user, res) {
    const payload = { user: { id: user.id } };
    jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' }, (err, token) => {
        if (err) throw err;
        res.json({ token, user: { id: user.id, name: user.name, email: user.email } });
    });
}

module.exports = router;
