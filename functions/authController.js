// authController.js
const bcrypt = require('bcrypt');

// In-memory user array (replace this with a database in a production environment)
const users = [];

// Route handler for creating a user
async function createUser(req, res) {
    try {
        const { username, password, type } = req.body;

        // Check if the username already exists
        const existingUser = users.find(user => user.username === username);
        if (existingUser) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Hash the password before saving it
        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = {
            username,
            password: hashedPassword,
            type,
            active: false,
            socketId: null,
            room: null,
        };

        users.push(newUser);

        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

async function login(req, res) {
    try {
        const { username, password } = req.body;

        // Find the user by username
        const user = users.find(u => u.username === username);

        // If the user does not exist, or password does not match, return an error
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Set user as active, update socketId if needed
        user.active = true;
        user.socketId = req.body.socketId || null;

        res.status(200).json({ message: 'Login successful', user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

module.exports = {
    createUser,
    login,
};
