const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');
const { expressjwt: jwtMiddleware } = require('express-jwt'); // Correct import
const path = require('path');

// Use express built-in middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS headers for frontend compatibility
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5500'); // Match the frontend's address
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

const PORT = 3000;
const secretKey = 'mySecretKey';

// JWT Middleware
const jwtProtection = jwtMiddleware({
    secret: secretKey,
    algorithms: ['HS256'],
});

// Dummy user data for authentication
const userList = [
    { id: 1, username: 'Rohith', password: 'r@123' },
    { id: 2, username: 'ram', password: '112' }
];

// Login Route
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    let matchedUser = null;

    for (let user of userList) {
        if (username === user.username && password === user.password) {
            const userToken = jwt.sign({ id: user.id, username: user.username }, secretKey, { expiresIn: '5m' });
            res.json({
                success: true,
                token: userToken,
            });
            matchedUser = user;
            break;
        }
    }

    if (!matchedUser) {
        res.status(401).json({
            success: false,
            error: 'Incorrect username or password',
        });
    }
});

// Dashboard (Protected)
app.get('/api/dashboard', jwtProtection, (req, res) => {
    res.json({
        success: true,
        dashboardContent: 'Welcome to your dashboard. This is secured content!',
    });
});

// Settings (Protected)
app.get('/api/settings', jwtProtection, (req, res) => {
    res.json({
        success: true,
        settingsDetails: 'These are your settings. Only authorized users can see this.',
    });
});

// Serve the static HTML file (index.html)
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Handle Unauthorized Errors
app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        res.status(401).json({
            success: false,
            error: 'Invalid token. Unauthorized access!',
        });
    } else {
        next(err);
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
