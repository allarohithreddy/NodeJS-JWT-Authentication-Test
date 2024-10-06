require('dotenv').config();
const express = require('express'); 
const app = express();
const jwt = require('jsonwebtoken');
const { expressjwt: jwtMiddleware } = require('express-jwt'); // Correct import for express-jwt v6+
const path = require('path');
const bcrypt = require('bcrypt');

const PORT = process.env.PORT || 3000;
const secretKey = process.env.SECRET_KEY;

// Use express built-in middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS headers
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', process.env.CORS_ORIGIN); // Use environment variable
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// JWT Middleware
const jwtProtection = jwtMiddleware({
    secret: secretKey,
    algorithms: ['HS256'],
});

// In-memory user data (for demonstration purposes)
let users = [
    {
        id: 1,
        username: 'Rohith',
        password: '$2b$10$yourhashedpasswordhere', // Replace with hashed passwords
    },
    {
        id: 2,
        username: 'Surya',
        password: '$2b$10$anotherhashedpassword', // Replace with hashed passwords
    }
];

// Helper function to find user by username
const findUserByUsername = (username) => users.find(user => user.username === username);

// Registration Route
app.post('/api/register', async (req, res) => {
    const { username, password } = req.body;

    // Basic input validation
    if (!username || !password) {
        return res.status(400).json({
            success: false,
            error: 'Username and password are required',
        });
    }

    // Check if user already exists
    if (findUserByUsername(username)) {
        return res.status(409).json({
            success: false,
            error: 'Username already exists',
        });
    }

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const newUser = {
            id: users.length + 1,
            username,
            password: hashedPassword,
        };

        users.push(newUser);

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
        });
    } catch (err) {
        res.status(500).json({
            success: false,
            error: 'Internal server error',
        });
    }
});

// Login Route
app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;
    const user = findUserByUsername(username);

    if (!user) {
        return res.status(401).json({
            success: false,
            token: null,
            error: 'Username or password is incorrect',
        });
    }

    try {
        // Compare password with hashed password
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            const token = jwt.sign(
                { id: user.id, username: user.username },
                secretKey,
                { expiresIn: '3m' }
            );
            res.json({
                success: true,
                error: null,
                token
            });
        } else {
            res.status(401).json({
                success: false,
                token: null,
                error: 'Username or password is incorrect',
            });
        }
    } catch (err) {
        res.status(500).json({
            success: false,
            token: null,
            error: 'Internal server error',
        });
    }
});

// Protected Dashboard Route
app.get('/api/dashboard', jwtProtection, (req, res) => {
    res.json({
        success: true,
        myContent: 'Secret content that only logged-in users can see'
    });
});

// Protected Settings Route
app.get('/api/settings', jwtProtection, (req, res) => {
    res.json({
        success: true,
        settingsContent: 'This is a protected settings page'
    });
});

// Serve Index File
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Error Handling Middleware for Unauthorized Access
app.use((err, req, res, next) => {
    if (err.name === 'UnauthorizedError') {
        res.status(401).json({
            success: false,
            error: 'Unauthorized access, invalid token'
        });
    } else {
        next(err);
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
