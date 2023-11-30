//server.js

const express = require('express');

const mongoose = require("mongoose");
const http = require('http');
const app = express();
const path = require('path');
const users = require('./users.js');
const codeBlocks = require(`./codeBlocks.js`);

const server = http.createServer(app);
const port = process.env.PORT || 3000;
const io = require('socket.io')(server);
const codeBlockRouter = require('./codeBlockRouter.js');
const rootDirectory = path.resolve(`${__dirname}/..`);

const pathRe = path.resolve(`${__dirname}/..`);
console.log(`${pathRe}`);

app.get('/', (req, res) => {
  res.sendFile(path.join(rootDirectory, 'public', 'mainPage.html'));
});

app.use('/code-block', codeBlockRouter);

app.use(express.static(path.join(rootDirectory, 'public')));
app.use(express.static(path.join(rootDirectory, 'blocks')));
app.use(express.static(path.join(__dirname)));

const uri = 'mongodb+srv://rotemkim:<yAiXqlppcF3SX0gQ>@cluster0.pv1o5s0.mongodb.net/?retryWrites=true&w=majority';
async function connect(){
  try{
    await mongoose.connect(uri);
    console.log("connected to MongoDB");
  } catch (error){
    console.error(error);
  }
}
// Initialize users with an array of available users
const availableUsers = [
  { name: 'Tom', type: 'Mentor', active: false, socketId: null, room: null },
  { name: 'Josh', type: 'Student', active: false, socketId: null, room: null }
];

// Connection to socket
io.on('connection', (socket) => {
  const socketId = socket.id;
  const currentUser = findAvailableUser();

  if (currentUser) {
    currentUser.active = true;
    currentUser.socketId = socketId;

    // Handle connection
    io.emit('userConnected', { users: availableUsers, socketId });
    
    // Emit user type to the connected client
    io.to(socketId).emit('userType', currentUser.type); // Emit user type to the connected client

    console.log(`${currentUser.name} connected`);
    socket.emit('codeBlocks', codeBlocks);
    
    // handle disconnect
    socket.on('disconnect', () => {
      const roomId = currentUser.room;
      if (roomId) {
        console.log(`${currentUser.name} left ${roomId}`);
        socket.leave(roomId);
        updateRoomStatus(socketId, null);
        io.to(roomId).emit('updateRoomUsers', getRoomUsers(roomId));
        currentUser.room = null;
      }
      console.log(`${currentUser.name} disconnected`);
      updateUserStatus(socketId, false);
      io.emit('userConnected', { users: availableUsers });
    });

    // someone enters a room
    socket.on('joinRoom', (roomId) => {
      console.log(`${currentUser.name} joined ${roomId}`);
      socket.join(roomId);
      currentUser.room = roomId;
      io.to(roomId).emit('updateRoomUsers', getRoomUsers(roomId));
    });

    // When somone leaves a room
    socket.on('leaveRoom', (roomId) => {
      console.log(`${currentUser.name} left ${roomId}`);
      socket.leave(roomId);
      updateRoomStatus(socketId, null);
      io.to(roomId).emit('updateRoomUsers', getRoomUsers(roomId));
      currentUser.room = null;
      // Check if the user is disconnected after leaving the room
      if (!socket.connected) {
        console.log(`${currentUser.name} disconnected after leaving the room`);
        updateUserStatus(socketId, false);
        io.emit('userConnected', { users: availableUsers });
      }
    });

    // when a student is typing
    socket.on('textChange', (text) => {
      // Broadcast the text change to mentors only
      if (currentUser.type === 'Student') {
        io.to(currentUser.room).emit('textChange', text);
      }
    });

    socket.on('sendAnswer', (data) => {
      const content = data.content; // Access the content from the payload
      console.log("Message received:", content);
      socket.to(currentUser.room).emit('receivedAnswer');
    });

  // Handle the case when there are no available users
  } else {
    console.log('No available users');
  }
});

server.listen(port, () => {
  console.log(`Server is running on port http://localhost:3000`);
  
});



//all server functions

// Function to find an available user
function findAvailableUser() {
  return availableUsers.find(user => !user.active);
}

// Function to update user status
function updateUserStatus(socketId, active) {
  const user = availableUsers.find(user => user.socketId === socketId);
  if (user) {
    user.active = active;
  }
}

function updateRoomStatus(socketId, room) {
  const user = availableUsers.find(user => user.socketId === socketId);
  if (user) {
    user.room = room;
  }
}

// Function to get users in a room
function getRoomUsers(roomId) {
  const roomSockets = io.sockets.adapter.rooms.get(roomId);
  const roomUsers = [];
  
  if (roomSockets) {
    roomSockets.forEach(socketId => {
      const user = availableUsers.find(u => u.socketId === socketId);

      // Check if the user is active before adding to the list
      if (user && user.active) {
        roomUsers.push(user);
      }
    });
  }

  return roomUsers;
}