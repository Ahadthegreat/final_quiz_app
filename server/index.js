import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import StablePriorityQueue from "stablepriorityqueue";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Store room data including leaderboards, timers, and start times
const roomData = new Map();
const roomTimers = new Map();

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
  }
});

io.on("connection", (socket) => {
  console.log(socket.id);

  socket.on('joinRoom', (roomCode) => {
    socket.join(roomCode);
    console.log(`Socket ${socket.id} joined room ${roomCode}`);
    
    // Send current room status to the joining user
    if (roomData.has(roomCode)) {
      const room = roomData.get(roomCode);
      socket.emit('roomStatus', {
        startTime: room.startTime,
        isStarted: room.isStarted,
        timeRemaining: room.startTime - Date.now()
      });
    }
  });
  
  socket.on("start", ({ roomCode }) => {
    if (!roomCode || roomData.has(roomCode)?.isStarted) {
      return;
    }

    const room = roomData.get(roomCode);
    if (!room || Date.now() < room.startTime) return;

    // Mark room as started
    room.isStarted = true;
    roomData.set(roomCode, room);

    // Start the quiz timer - use a longer duration for the actual quiz
    const startTime = Date.now();
    const quizDuration = 5 * 60 * 1000; // 5 minutes for the quiz
    
    const intervalId = setInterval(() => {
      const elapsed = Date.now() - startTime;
      io.to(roomCode).emit("time", elapsed);

      if (elapsed >= quizDuration) {
        clearInterval(intervalId);
        io.to(roomCode).emit("end", "Quiz time finished");
        roomTimers.delete(roomCode);
      }
    }, 1000);
    
    roomTimers.set(roomCode, { intervalId });
  });
});

app.post("/create-quiz", async (req, res) => {
    const { title, description, startTime } = req.body;
    console.log("Quiz created:", { title, description, startTime });
    
    // Generate a unique room code
    const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // Parse start time and convert to timestamp
    const startTimestamp = new Date(startTime).getTime();
    
    // Initialize room data
    const room = {
        title,
        description,
        startTime: startTimestamp,
        isStarted: false,
        leaderboard: new StablePriorityQueue((a, b) => b.points - a.points)
    };
    
    roomData.set(roomCode, room);
    
    res.json({
        roomCode,
        message: "Quiz created successfully",
        startTime: startTimestamp
    });
});

// Submit score endpoint with per-question scoring
app.post("/submit-score", async (req, res) => {
    const { questionIndex, selectedAnswer, correctAnswer, timeTaken, roomCode, playerId } = req.body;
    
    console.log('Question score submission received:', { questionIndex, selectedAnswer, correctAnswer, timeTaken, roomCode, playerId });
    
    if (!roomData.has(roomCode)) {
        console.log('Room not found:', roomCode);
        return res.status(404).json({ error: "Room not found" });
    }
    
    const room = roomData.get(roomCode);
    const leaderboard = room.leaderboard;
    
    // Check if answer is correct
    const isCorrect = selectedAnswer === correctAnswer;
    
    // Calculate score for this question with time decay
    let questionPoints = 0;
    if (isCorrect) {
        const basePoints = 100; // Base 100 points per correct answer
        const maxTime = 5 * 60 * 1000; // 5 minutes max (same as quiz duration)
        const timeDecay = Math.max(0, 1 - (timeTaken / maxTime)); // Decay factor based on time
        questionPoints = Math.round(basePoints * (0.6 + 0.4 * timeDecay)); // Min 60%, max 100%
    }
    
    console.log('Question score calculation:', { isCorrect, basePoints: isCorrect ? 100 : 0, timeDecay: isCorrect ? Math.max(0, 1 - (timeTaken / (5 * 60 * 1000))) : 0, questionPoints });
    
    // Find existing player entry or create new one
    let playerEntry = null;
    const tempQueue = new StablePriorityQueue((a, b) => b.points - a.points);
    
    // Copy all entries to temp queue and find player
    while (!leaderboard.isEmpty()) {
        const entry = leaderboard.poll();
        if (entry.player.id === playerId) {
            playerEntry = entry;
        } else {
            tempQueue.add(entry);
        }
    }
    
    // Update or create player entry
    if (playerEntry) {
        // Update existing player
        playerEntry.points += questionPoints;
        playerEntry.player.correctCount = (playerEntry.player.correctCount || 0) + (isCorrect ? 1 : 0);
        playerEntry.player.totalQuestions = (playerEntry.player.totalQuestions || 0) + 1;
        playerEntry.player.lastUpdate = Date.now();
        
        // Add back to queue
        tempQueue.add(playerEntry);
    } else {
        // Create new player entry
        const newEntry = {
            points: questionPoints,
            player: {
                id: playerId,
                correctCount: isCorrect ? 1 : 0,
                totalQuestions: 1,
                timeTaken: timeTaken,
                lastUpdate: Date.now()
            }
        };
        tempQueue.add(newEntry);
    }
    
    // Restore all entries to leaderboard
    while (!tempQueue.isEmpty()) {
        leaderboard.add(tempQueue.poll());
    }
    
    // Get updated leaderboard
    const topScores = [];
    const tempQueue2 = new StablePriorityQueue((a, b) => b.points - a.points);
    
    // Copy all entries to temp queue
    while (!leaderboard.isEmpty()) {
        const entry = leaderboard.poll();
        tempQueue2.add(entry);
    }
    
    // Get top 10 scores
    while (!tempQueue2.isEmpty() && topScores.length < 10) {
        const entry = tempQueue2.poll();
        topScores.push(entry);
        leaderboard.add(entry); // Restore to original queue
    }
    
    // Restore remaining entries
    while (!tempQueue2.isEmpty()) {
        leaderboard.add(tempQueue2.poll());
    }
    
    console.log('Updated leaderboard:', topScores);
    
    // Emit updated leaderboard to all users in the room
    io.to(roomCode).emit("leaderboardUpdate", topScores);
    
    res.json({
        message: "Question score submitted successfully",
        isCorrect,
        questionPoints,
        totalPoints: playerEntry ? playerEntry.points : questionPoints,
        leaderboard: topScores
    });
});

// Legacy endpoint for final quiz submission (kept for backward compatibility)
app.post("/submit-final-score", async (req, res) => {
    const { correctCount, timeTaken, roomCode, playerId } = req.body;
    
    console.log('Final score submission received:', { correctCount, timeTaken, roomCode, playerId });
    
    if (!roomData.has(roomCode)) {
        console.log('Room not found:', roomCode);
        return res.status(404).json({ error: "Room not found" });
    }
    
    const room = roomData.get(roomCode);
    const leaderboard = room.leaderboard;
    
    // Find existing player entry
    let playerEntry = null;
    const tempQueue = new StablePriorityQueue((a, b) => b.points - a.points);
    
    // Copy all entries to temp queue and find player
    while (!leaderboard.isEmpty()) {
        const entry = leaderboard.poll();
        if (entry.player.id === playerId) {
            playerEntry = entry;
        } else {
            tempQueue.add(entry);
        }
    }
    
    // Update player's final stats
    if (playerEntry) {
        playerEntry.player.finalCorrectCount = correctCount;
        playerEntry.player.finalTimeTaken = timeTaken;
        playerEntry.player.completed = true;
        tempQueue.add(playerEntry);
    }
    
    // Restore all entries to leaderboard
    while (!tempQueue.isEmpty()) {
        leaderboard.add(tempQueue.poll());
    }
    
    // Get updated leaderboard
    const topScores = [];
    const tempQueue2 = new StablePriorityQueue((a, b) => b.points - a.points);
    
    // Copy all entries to temp queue
    while (!leaderboard.isEmpty()) {
        const entry = leaderboard.poll();
        tempQueue2.add(entry);
    }
    
    // Get top 10 scores
    while (!tempQueue2.isEmpty() && topScores.length < 10) {
        const entry = tempQueue2.poll();
        topScores.push(entry);
        leaderboard.add(entry); // Restore to original queue
    }
    
    // Restore remaining entries
    while (!tempQueue2.isEmpty()) {
        leaderboard.add(tempQueue2.poll());
    }
    
    // Emit updated leaderboard to all users in the room
    io.to(roomCode).emit("leaderboardUpdate", topScores);
    
    res.json({
        message: "Final score submitted successfully",
        leaderboard: topScores
    });
});

// Get leaderboard endpoint
app.get("/leaderboard/:roomCode", (req, res) => {
    const { roomCode } = req.params;
    
    if (!roomData.has(roomCode)) {
        return res.status(404).json({ error: "Room not found" });
    }
    
    const room = roomData.get(roomCode);
    const leaderboard = room.leaderboard;
    const topScores = [];
    const tempQueue = new StablePriorityQueue((a, b) => b.points - a.points);
    
    // Copy all entries to temp queue
    while (!leaderboard.isEmpty()) {
        const entry = leaderboard.poll();
        tempQueue.add(entry);
    }
    
    // Get top 10 scores
    while (!tempQueue.isEmpty() && topScores.length < 10) {
        const entry = tempQueue.poll();
        topScores.push(entry);
        leaderboard.add(entry); // Restore to original queue
    }
    
    // Restore remaining entries
    while (!tempQueue.isEmpty()) {
        leaderboard.add(tempQueue.poll());
    }
    
    res.json({
        roomCode,
        leaderboard: topScores,
        startTime: room.startTime,
        isStarted: room.isStarted
    });
});

// Get room status endpoint
app.get("/room-status/:roomCode", (req, res) => {
    const { roomCode } = req.params;
    
    if (!roomData.has(roomCode)) {
        return res.status(404).json({ error: "Room not found" });
    }
    
    const room = roomData.get(roomCode);
    res.json({
        roomCode,
        title: room.title,
        description: room.description,
        startTime: room.startTime,
        isStarted: room.isStarted,
        timeRemaining: room.startTime - Date.now()
    });
});

httpServer.listen(3000, () => {
  console.log(`http://localhost:3000`);
});