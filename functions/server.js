//server.js

const express = require('express');
const mongoose = require("mongoose");
const cookie = require('cookie');
const http = require('http');
const app = express();
const path = require('path');
const cookieParser = require('cookie-parser');
const codeBlocks = require(`./codeBlocks.js`);
const serverFunc = require('./serverFunctions.js');
const connectDB = require('./db');
const {UserModel, ActiveUserModel} = require('./../auth/userModel.js');

const server = http.createServer(app);
const port = process.env.PORT || 3000;
const io = require('socket.io')(server);

const rootDirectory = path.resolve(`${__dirname}/..`);

const pathRe = path.resolve(`${__dirname}/..`);
console.log(`${pathRe}`);

connectDB();

app.get('/', (req, res) => {
  res.sendFile(path.join(rootDirectory, 'public', 'firstPage.html'));
});


app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static(path.join(rootDirectory, 'public')));
app.use(express.static(path.join(rootDirectory, 'blocks')));
app.use(express.static(path.join(rootDirectory, 'auth')));
app.use(express.static(path.join(rootDirectory)));

const ejs = require('ejs');
app.set('views', path.join(rootDirectory, 'auth'));
app.set('view engine', 'ejs');

const codeBlockRouter = require('./codeBlockRouter.js');
const authRouter = require('./authRouter.js');
app.use('/auth', authRouter);
app.use('/code-block', codeBlockRouter);

// In memory logged users 
let activeUsers = [];

// Connection to socket
io.on('connection', async (socket) => {
  const socketId = socket.id;
  let activeUsersDoc = await ActiveUserModel.findOne();
  if (!activeUsersDoc) {
    activeUsersDoc = new ActiveUserModel({
      users: [],
    });
    await activeUsersDoc.save();
  }
  const cookieName = getUsernameFromCookie(socket);
  let currentUser;
  if(cookieName){
    currentUser = await UserModel.findOne({ username: cookieName });
  }
  else{
    return;
  }
    currentUser.active = true;
    currentUser.socketId = socketId;
    const isUserInActiveUsersDoc = activeUsersDoc.users.some(user => user.username === currentUser.username);
    if(!isUserInActiveUsersDoc){
      activeUsersDoc.users.push(currentUser);
      await activeUsersDoc.save();
      activeUsers = activeUsersDoc.users;
    }
    
    // Handle connection
    io.emit('serverReady', currentUser, activeUsers, socketId, rootDirectory);
    io.to(socketId).emit('userType', currentUser.userType);
    console.log(`${currentUser.username} connected`);
    socket.emit('codeBlocks', codeBlocks);
    


    // handle disconnect
    socket.on('disconnect', async() => {
      const roomId = currentUser.room;
      if (roomId) {
        console.log(`${currentUser.username} left ${roomId}`);
        socket.leave(roomId);
        updateRoomStatus(activeUsers, currentUser, null);
        io.to(roomId).emit('updateRoomUsers', getRoomUsers(activeUsers, roomId, currentUser));
      }

      // Remove the user from the activeUsers array
      const userIndex = activeUsers.findIndex(user => user.username === currentUser.username);
      if (userIndex !== -1) {
        activeUsers.splice(userIndex, 1);
      }
      try {
        const updatedActiveUser = await ActiveUserModel.findOneAndUpdate(
          {},
          { $pull: { users: { username: currentUser.username } } },
          { new: true, useFindAndModify: false }
        );
      } catch (error) {
        console.error('Error removing user from activeUsersDoc:', error);
      }
      socket.handshake.headers.cookie = `username=${currentUser.username}; Max-Age=${60*60*24*7};${true ? ' HttpOnly;' : ''}`;
      console.log(`${currentUser.username} disconnected`);
      
      io.emit('updateActiveUsers', { activeUsers: activeUsers});
    });

    // someone enters a room
    socket.on('joinRoom', (roomId) => {
      console.log(`${currentUser.username} joined ${roomId}`);
      socket.join(roomId);
      currentUser.room = roomId;
      const userIndex = activeUsers.findIndex(user => user.username === currentUser.username);
      if (userIndex !== -1) {
        activeUsers[userIndex].room = roomId;
      }
      io.to(roomId).emit('updateRoomUsers', getRoomUsers(activeUsers, roomId, currentUser));
    });
  

    // When somone leaves a room
    socket.on('leaveRoom', (roomId) => {
      console.log(`${currentUser.username} left ${roomId}`);
      socket.leave(roomId);
      updateRoomStatus(activeUsers, currentUser, null);
      io.to(roomId).emit('updateRoomUsers', getRoomUsers(roomId));
      currentUser.room = null;
      // Check if the user is disconnected after leaving the room
      if (!socket.connected) {
        console.log(`${currentUser.username} disconnected after leaving the room`);
        updateUserStatus(currentUser, false);
        io.emit('userConnected', { users: availableUsers });
      }
    });

    // when a student is typing
    socket.on('textChange', (text) => {
        io.to(currentUser.room).emit('textChange', text);
    });

    socket.on('sendAnswer', (data) => {
      const content = data.content; // Access the content from the payload
      console.log("Message received:", content);
      socket.to(currentUser.room).emit('receivedAnswer');
    });
});

server.listen(port, () => {
  console.log(`Server is running on port http://localhost:3000`);
  
});

// functions

function updateUserStatus(activeUsers, currentUser, active) {
  const user = activeUsers.find(user => user.username === currentUser.username);
  if (user) {
    user.active = active;
  }
}

function updateRoomStatus(activeUsers, currentUser, room) {
  const user = activeUsers.find(user => user.username === currentUser.username);
  if (user) {
    user.room = room;
  }
}

function getActiveUsers(activeUsers){
  const roomUsers = [];
  activeUsers.forEach(user => {
    if (user && user.active) {
      roomUsers.push(user);
    }
    return roomUsers;
  });
}

// Function to get users in a room
function getRoomUsers(activeUsers, roomId, currentUser) {
  const roomSockets = io.sockets.adapter.rooms.get(roomId);
  const roomUsers = [];
  
  if (roomSockets) {
    roomSockets.forEach(socketId => {
      const user = activeUsers.find(u => u.socketId === socketId);
      // Check if the user is active before adding to the list
      if (user && user.active) {
        roomUsers.push(user);
      }
    });
  }
  return roomUsers;
}

const updateUserInDatabase = async (username, updates) => {
  try {
    const updatedUser = await UserModel.findOneAndUpdate(
      { username },
      updates,
      { new: true }
    );
    return updatedUser;
  } catch (error) {
    console.error('Error updating user information:', error);
    throw error; // Propagate the error
  }
};

function getUsernameFromCookie(socket) {
  // Try to get the username from a cookie
  const cookieHeader = socket.handshake.headers.cookie;
  const userIdFromCookie = getCookie('username', cookieHeader);
  return userIdFromCookie;
}

function getCookie(name, cookieHeader) {
  const cookies = cookie.parse(cookieHeader || ''); // Parse the cookie header
  return cookies[name] || null;
}


function updateUserInArray(usersArray, currentUser, update) {
  const userIndex = usersArray.findIndex(user => user.username === currentUser.username);

  if (userIndex !== -1) {
    usersArray[userIndex] = { ...usersArray[userIndex], ...update };
  }
}