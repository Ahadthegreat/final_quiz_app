import { io } from 'socket.io-client';

const URL = 'http://localhost:3000';
export const socket = io(URL, { 
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
});

// Connection event handlers
socket.on('connect', () => {
    console.log('Socket connected:', socket.id);
});

socket.on('disconnect', () => {
    console.log('Socket disconnected');
});

socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
});
