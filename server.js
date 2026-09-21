const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

const { createGame, chooseContract, playCardTricks, playCardRentz, skipTurnRentz } = require('./game.js');

const rooms = new Map();

function generateRoomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('createRoom', (playerName) => {
        const roomCode = generateRoomCode();
        rooms.set(roomCode, {
            players: [],
            game: null
        })
        rooms.get(roomCode).players.push({id: socket.id , name: playerName});
        socket.join(roomCode);
        socket.emit('roomCreated', roomCode);
    });

    socket.on('joinRoom', (data) => {
        const { roomCode, playerName } = data;
        if(!rooms.has(roomCode)) {
            socket.emit('error', 'Room does not exist');
            return;
        }
        if(rooms.get(roomCode).players.length === 6){
            socket.emit('error', 'Room is full');
            return;
        }
        if(rooms.get(roomCode).game !== null){
            socket.emit('error', 'Game already started');
            return;
        }
        rooms.get(roomCode).players.push({id: socket.id , name: playerName});
        socket.join(roomCode);
        io.to(roomCode).emit('playerJoined', rooms.get(roomCode).players);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
    });
});