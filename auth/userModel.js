// userModel.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: String,
    password: String,
    userType: String,
    active: Boolean,
    socketId: String,
    room: String,
});

const activeUsersSchema = new mongoose.Schema({
    users: [userSchema],
  });
  
const ActiveUserModel = mongoose.model('Active Users', activeUsersSchema);

const UserModel = mongoose.model('User', userSchema);

module.exports = {UserModel, ActiveUserModel}; // mongodb+srv://rotemkim:ONFT8Q3kCPxetvG6@cluster0.pv1o5s0.mongodb.net/admin
