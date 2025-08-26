import React, { useEffect, useState } from 'react';
import { socket } from '../socket';

interface LeaderboardEntry {
    player: {
        id: string;
        correctCount: number;
        totalQuestions?: number;
        timeTaken?: number;
        lastUpdate?: number;
        completed?: boolean;
        finalCorrectCount?: number;
        finalTimeTaken?: number;
    };
    points: number;
}

interface LeaderboardProps {
    roomCode: string;
}

function Leaderboard({ roomCode }: LeaderboardProps) {
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
    const [isUpdating, setIsUpdating] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!roomCode) return;

        // Ensure socket is connected
        if (!socket.connected) {
            socket.connect();
        }

        fetchLeaderboard();

        function onLeaderboardUpdate(newLeaderboard: LeaderboardEntry[]) {
            console.log('Leaderboard update received:', newLeaderboard);
            setLeaderboard(newLeaderboard);
            setLastUpdate(new Date());
            setIsUpdating(true);
            setIsLoading(false);
            
            // Remove updating indicator after 2 seconds
            setTimeout(() => setIsUpdating(false), 2000);
        }

        socket.on('leaderboardUpdate', onLeaderboardUpdate);

        // Also listen for socket connection events to re-fetch data
        const handleConnect = () => {
            console.log('Socket connected, fetching leaderboard...');
            fetchLeaderboard();
        };

        socket.on('connect', handleConnect);

        // Set up periodic refresh as fallback (every 10 seconds)
        const refreshInterval = setInterval(fetchLeaderboard, 10000);

        return () => {
            socket.off('leaderboardUpdate', onLeaderboardUpdate);
            socket.off('connect', handleConnect);
            clearInterval(refreshInterval);
        };
    }, [roomCode]);

    const fetchLeaderboard = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`http://localhost:3000/leaderboard/${roomCode}`);
            if (response.ok) {
                const data = await response.json();
                setLeaderboard(data.leaderboard || []);
                setLastUpdate(new Date());
            }
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (milliseconds: number) => {
        if (!milliseconds) return '0s';
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        if (minutes > 0) {
            return `${minutes}m ${remainingSeconds}s`;
        }
        return `${remainingSeconds}s`;
    };

    const getPlayerStatus = (entry: LeaderboardEntry) => {
        if (entry.player.completed) {
            return { text: 'Completed', color: 'text-green-600', bg: 'bg-green-100' };
        } else if (entry.player.totalQuestions && entry.player.totalQuestions > 0) {
            return { text: 'In Progress', color: 'text-blue-600', bg: 'bg-blue-100' };
        } else {
            return { text: 'Not Started', color: 'text-gray-600', bg: 'bg-gray-100' };
        }
    };

    if (isLoading) {
        return (
            <div className="bg-white p-6 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold mb-4">Live Leaderboard</h2>
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Live Leaderboard</h2>
                <div className="flex items-center space-x-2">
                    {isUpdating && (
                        <div className="flex items-center text-green-600 bg-green-50 px-3 py-1 rounded-full">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                            <span className="text-sm font-medium">Live Update</span>
                        </div>
                    )}
                    <button 
                        onClick={fetchLeaderboard}
                        className="text-blue-600 hover:text-blue-800 text-sm bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-full transition-colors"
                    >
                        Refresh
                    </button>
                </div>
            </div>
            
            <div className="text-xs text-gray-500 mb-3 flex items-center justify-between">
                <span>Last updated: {lastUpdate.toLocaleTimeString()}</span>
                <span className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                    Real-time updates active
                </span>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full">
                    <thead>
                        <tr className="bg-gray-100">
                            <th className="px-3 py-2 text-left text-xs">Rank</th>
                            <th className="px-3 py-2 text-left text-xs">Score</th>
                            <th className="px-3 py-2 text-left text-xs">Progress</th>
                            <th className="px-3 py-2 text-left text-xs">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaderboard.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                    <div className="text-gray-400 mb-2">📊</div>
                                    No scores yet
                                    <div className="text-xs text-gray-400 mt-1">
                                        Be the first to answer questions!
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            leaderboard.map((entry, index) => {
                                const status = getPlayerStatus(entry);
                                const progress = entry.player.totalQuestions || 0;
                                const correct = entry.player.correctCount || 0;
                                
                                return (
                                    <tr key={entry.player.id} className={index % 2 === 0 ? 'bg-gray-50' : ''}>
                                        <td className="px-3 py-2">
                                            <div className="flex items-center">
                                                {index === 0 && <span className="text-yellow-500 mr-2">🥇</span>}
                                                {index === 1 && <span className="text-gray-400 mr-2">🥈</span>}
                                                {index === 2 && <span className="text-orange-500 mr-2">🥉</span>}
                                                <span className="font-semibold text-sm">{index + 1}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="font-bold text-lg">{entry.points}</div>
                                        </td>
                                        <td className="px-3 py-2">
                                            <div className="text-sm">
                                                <div className="font-medium">{correct} correct</div>
                                                {progress > 0 && (
                                                    <div className="text-xs text-gray-500">
                                                        {progress} questions
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2">
                                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                                                {status.text}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                    <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                            <span className="w-3 h-3 bg-green-100 rounded-full mr-2"></span>
                            Completed
                        </span>
                        <span className="flex items-center">
                            <span className="w-3 h-3 bg-blue-100 rounded-full mr-2"></span>
                            In Progress
                        </span>
                        <span className="flex items-center">
                            <span className="w-3 h-3 bg-gray-100 rounded-full mr-2"></span>
                            Not Started
                        </span>
                    </div>
                </div>
            </div>

            {/* Debug Panel */}
            <div className="mt-4 pt-4 border-t border-gray-200">
                <details className="text-xs text-gray-500">
                    <summary className="cursor-pointer hover:text-gray-700">Debug Info</summary>
                    <div className="mt-2 space-y-1">
                        <div>Socket Connected: {socket.connected ? '✅ Yes' : '❌ No'}</div>
                        <div>Socket ID: {socket.id || 'None'}</div>
                        <div>Room Code: {roomCode}</div>
                        <div>Leaderboard Entries: {leaderboard.length}</div>
                        <div>Last Update: {lastUpdate.toISOString()}</div>
                    </div>
                </details>
            </div>
        </div>
    );
}

export default Leaderboard;