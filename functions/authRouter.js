// authRouter.js
const express = require('express');
const { UserModel, ActiveUserModel } = require('./../auth/userModel'); // Adjust the path as needed
const router = express.Router();
const path = require('path');
const bcrypt = require('bcrypt');
const rootDirectory = path.resolve(`${__dirname}/..`);

router.use(express.urlencoded({ extended: true }));

// Serve the createUser.ejs page
router.get('/createUser', (req, res) => {
    res.render('createUser', { errorMessage: null });
  });

// Route for handling user creation form submission
router.post('/createUser', async (req, res) => {
    const { username, password, userType } = req.body;

    try {
        // Check if a user with the same username already exists
        const existingUser = await UserModel.findOne({ username });

        if (existingUser) {
            // If a user with the same username exists, respond with an error
            res.render('createUser', { errorMessage: 'Username already exists' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        // Create a new user instance
        const newUser = new UserModel({
            username,
            password : hashedPassword,
            userType,
            active: false,
            socketId: null,
            room: null,
        });

        // Save the user to the database
        const savedUser = await newUser.save();

        console.log('User created:', savedUser.username);

        // Redirect to the login page after successful user creation
        res.redirect('/auth/login');

    } catch (error) {
        console.error('Error handling createUser:', error);
        res.status(500).send('Internal Server Error');
    }
});


// Route for logging in
router.get('/login', (req, res) => {
    res.render('login', { errorMessage: null });
});

// Route for handling login form submission
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        // Find the user in the database based on the provided username and password
        const user = await UserModel.findOne({ username });
        if (user) {
            const passwordMatch = await bcrypt.compare(password, user.password);
            if(passwordMatch){
                // Save a cookie with username
            res.cookie(`username`, user.username, { maxAge: 24 * 60 * 60 * 1000, httpOnly: true });
            // Find any document in the collection
            const activeUsersDoc = await ActiveUserModel.findOne({});

            if (!activeUsersDoc) {
                // If the document doesn't exist, create it with the user in the 'users' array
                const newActiveUserDoc = new ActiveUserModel({
                    users: [user],
                });
                const savedActiveUser = await newActiveUserDoc.save();
                console.log('Saved Active User:', savedActiveUser);
            } else {
                const activeUser = await ActiveUserModel.findOne({ 'users.username': username });

                if (activeUser) {
                    // If the user is already in activeUsers, they are already logged in
                    res.render('login', { errorMessage: 'User is already logged in' });
                    return;
                }
            }
            console.log('User logged in:', user.username);
            // Redirect to the mainPage.html after successful login
            res.redirect('/mainPage.html');
            } 
            else{
                // If the password is incorrect
                res.render('login', { errorMessage: 'Invalid username or password' });
            }   
        } else {
            // If the user does not exist or the password is incorrect
            res.render('login', { errorMessage: 'Invalid username or password' });
        }
    } catch (error) {
        console.error('Error handling login:', error);
        res.status(500).send('Internal Server Error');
    }
});


module.exports = router;
