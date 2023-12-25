
const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const mongoose = require("mongoose");
const cookie = require('cookie');
const io = require('socket.io')(server);

function updateUserStatus(activeUsers, socketId, active) {
    const user = activeUsers.find(user => user.socketId === socketId);
    if (user) {
      user.active = active;
    }
  }
  
  function updateRoomStatus(activeUsers, socketId, room) {
    const user = activeUsers.find(user => user.socketId === socketId);
    if (user) {
      user.room = room;
    }
  }
  
  // Function to get users in a room
  function getRoomUsers(activeUsers, roomId, socketId) {
    const roomSockets = io.sockets.adapter.rooms.get(roomId);
    const roomUsers = [];
    console.log(socketId);
    console.log(activeUsers);
    
    if (roomSockets) {
      roomSockets.forEach(socketId => {
        
        const user = activeUsers.find(u => u.socketId === socketId);
        
        console.log(user);
        // Check if the user is active before adding to the list
        if (user && user.active) {
          roomUsers.push(user);
        }
      });
    }
    console.log(roomUsers);
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
  
  // function getCookie(name) {
  //   const cookies = document.cookie.split(';');
  //   for (const cookie of cookies) {
  //     const [cookieName, cookieValue] = cookie.trim().split('=');
  //     if (cookieName === name) {
  //       return cookieValue;
  //     }
  //   }
  //   return null;
  // }

  module.exports = {updateRoomStatus, updateUserInDatabase, updateUserStatus, getRoomUsers, getUsernameFromCookie, }