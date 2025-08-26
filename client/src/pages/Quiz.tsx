import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../socket';
import Questions from '../Components/questions';
import Leaderboard from '../Components/Leaderboard';

interface RoomStatus {
    title: string;
    description: string;
    startTime: number;
    isStarted: boolean;
}

function Quiz() {
    const { roomCode } = useParams<{ roomCode: string }>();
    const [started, setStarted] = useState(false);
    const [timer, setTimer] = useState(0);
    const [roomStatus, setRoomStatus] = useState<RoomStatus | null>(null);
    const [countdown, setCountdown] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!roomCode) return;

        // Ensure socket is connected
        if (!socket.connected) {
            socket.connect();
        }

        // Fetch initial room status
        fetchRoomStatus();

        // Join room
        socket.emit('joinRoom', roomCode);

        // Listen for room status updates
        socket.on('roomStatus', (status: RoomStatus) => {
            setRoomStatus(status);
            setIsLoading(false);
            
            if (status.isStarted) {
                setStarted(true);
            } else if (status.startTime > Date.now()) {
                // Quiz hasn't started yet, show countdown
                const timeUntilStart = status.startTime - Date.now();
                setCountdown(timeUntilStart);
            }
        });

        // Listen for quiz start
        socket.on('quizStarted', (duration: number) => {
            setStarted(true);
            setCountdown(0);
            setTimer(duration);
        });

        // Listen for timer updates
        socket.on('timerUpdate', (timeLeft: number) => {
            setTimer(timeLeft);
        });

        return () => {
            socket.off('roomStatus');
            socket.off('quizStarted');
            socket.off('timerUpdate');
        };
    }, [roomCode]);

    useEffect(() => {
        if (countdown > 0) {
            const interval = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1000) {
                        return 0;
                    }
                    return prev - 1000;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [countdown]);

    const fetchRoomStatus = async () => {
        try {
            const response = await fetch(`http://localhost:3000/room-status/${roomCode}`);
            if (response.ok) {
                const data = await response.json();
                setRoomStatus(data);
                setIsLoading(false);
                
                if (data.isStarted) {
                    setStarted(true);
                } else if (data.startTime > Date.now()) {
                    setCountdown(data.startTime - Date.now());
                }
            }
        } catch (error) {
            console.error('Error fetching room status:', error);
            setIsLoading(false);
        }
    };

    const formatCountdown = (milliseconds: number) => {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    const formatQuizTime = (milliseconds: number) => {
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h2 className="text-2xl font-bold text-gray-800">Loading Quiz Room...</h2>
                    <p className="text-gray-600 mt-2">Please wait while we prepare your quiz experience.</p>
                </div>
            </div>
        );
    }

    if (!roomStatus) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="text-3xl">❌</span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Room Not Found</h2>
                    <p className="text-gray-600">The quiz room you're looking for doesn't exist.</p>
                </div>
            </div>
        );
    }

    if (!started && countdown > 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
                {/* Navigation */}
                <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between items-center h-16">
                            <div className="flex items-center">
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    QuizMaster
                                </h1>
                            </div>
                            <div className="text-sm text-gray-600">
                                Room: <span className="font-mono font-bold">{roomCode}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${socket.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className={`text-xs ${socket.connected ? 'text-green-600' : 'text-red-600'}`}>
                                    {socket.connected ? 'Connected' : 'Disconnected'}
                                </span>
                            </div>
                        </div>
                    </div>
                </nav>

                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
                    <div className="bg-white rounded-2xl shadow-xl p-12">
                        <div className="mb-8">
                            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <span className="text-5xl">⏰</span>
                            </div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-4">{roomStatus.title}</h1>
                            <p className="text-xl text-gray-600 mb-8">{roomStatus.description}</p>
                        </div>

                        <div className="mb-8">
                            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Quiz Starts In</h2>
                            <div className="text-6xl font-mono font-bold text-blue-600 mb-4">
                                {formatCountdown(countdown)}
                            </div>
                            <p className="text-gray-600">Get ready! The quiz will begin automatically.</p>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-6">
                            <h3 className="text-lg font-semibold text-blue-800 mb-2">What to expect:</h3>
                            <ul className="text-blue-700 space-y-1 text-left max-w-md mx-auto">
                                <li>• Real-time scoring with time-based bonuses</li>
                                <li>• Live leaderboard updates</li>
                                <li>• Interactive question navigation</li>
                                <li>• Instant feedback on answers</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Navigation */}
            <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                QuizMaster
                            </h1>
                        </div>
                        <div className="flex items-center space-x-6">
                            <div className="text-center">
                                <div className="text-xs text-gray-500 uppercase tracking-wide">Quiz Timer</div>
                                <div className="text-2xl font-mono font-bold text-blue-600">{formatQuizTime(timer)}</div>
                            </div>
                            <div className="text-sm text-gray-600">
                                Room: <span className="font-mono font-bold">{roomCode}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${socket.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                <span className={`text-xs ${socket.connected ? 'text-green-600' : 'text-red-600'}`}>
                                    {socket.connected ? 'Connected' : 'Disconnected'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">{roomStatus.title}</h1>
                    <p className="text-lg text-gray-600">{roomStatus.description}</p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Quiz Questions */}
                    <div className="lg:col-span-2">
                        <Questions timer={timer} roomCode={roomCode!} />
                    </div>

                    {/* Leaderboard */}
                    <div className="lg:col-span-1">
                        <Leaderboard roomCode={roomCode!} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Quiz;
