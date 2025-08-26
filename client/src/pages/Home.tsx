import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

function Home() {
    const [roomCode, setRoomCode] = useState('');
    const [isVisible, setIsVisible] = useState(false);
    const [currentFeature, setCurrentFeature] = useState(0);
    const navigate = useNavigate();

    useEffect(() => {
        setIsVisible(true);
        
        // Auto-rotate features
        const interval = setInterval(() => {
            setCurrentFeature((prev) => (prev + 1) % 3);
        }, 4000);
        
        return () => clearInterval(interval);
    }, []);

    const handleJoinQuiz = () => {
        if (roomCode) {
            navigate(`/take-quiz/${roomCode}`);
        } else {
            alert('Please enter a room code.');
        }
    };

    const features = [
        {
            icon: '⚡',
            title: 'Real-Time Updates',
            description: 'Live leaderboards and instant score updates keep everyone engaged and competitive',
            color: 'from-blue-100 to-blue-200',
            textColor: 'text-blue-800'
        },
        {
            icon: '🎯',
            title: 'Smart Scoring',
            description: 'Time-based scoring system rewards quick thinking and accuracy',
            color: 'from-purple-100 to-purple-200',
            textColor: 'text-purple-800'
        },
        {
            icon: '📱',
            title: 'Responsive Design',
            description: 'Works perfectly on all devices - desktop, tablet, and mobile',
            color: 'from-green-100 to-green-200',
            textColor: 'text-green-800'
        }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
            {/* Animated Background Elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float"></div>
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-float animation-delay-800"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse-slow"></div>
            </div>

            {/* Navigation */}
            <nav className={`bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <div className="flex-shrink-0 hover:scale-105 transition-transform duration-200">
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    QuizMaster
                                </h1>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link to="/create-quiz" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:bg-blue-50 hover:scale-105">
                                Create Quiz
                            </Link>
                            <button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg">
                                Sign In
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                    <div className={`text-center transition-all duration-1000 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <div className="mb-8">
                            <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce">
                                <span className="text-5xl">🎯</span>
                            </div>
                        </div>
                        
                        <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
                            Create & Join
                            <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent animate-pulse-slow">
                                Interactive Quizzes
                            </span>
                        </h1>
                        
                        <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
                            Experience real-time competitive quizzes with live leaderboards, instant scoring, 
                            and dynamic countdown timers. Perfect for classrooms, team building, and fun competitions.
                        </p>
                        
                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
                            <Link to="/create-quiz">
                                <button className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-5 rounded-2xl text-xl font-semibold hover:from-blue-700 hover:to-purple-700 transform hover:scale-110 transition-all duration-300 shadow-2xl hover:shadow-3xl">
                                    <span className="flex items-center gap-3">
                                        🚀 Create Quiz
                                        <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                                    </span>
                                </button>
                            </Link>
                            <button className="group border-2 border-gray-300 text-gray-700 px-10 py-5 rounded-2xl text-xl font-semibold hover:border-blue-500 hover:text-blue-600 transition-all duration-300 transform hover:scale-110 hover:bg-blue-50">
                                <span className="flex items-center gap-3">
                                    📚 Learn More
                                    <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
                                </span>
                            </button>
                        </div>

                        {/* Join Quiz Section */}
                        <div className="bg-white/70 backdrop-blur-sm rounded-3xl p-10 shadow-2xl border border-white/20 max-w-lg mx-auto hover-lift">
                            <h3 className="text-3xl font-bold text-gray-800 mb-6">Join Existing Quiz</h3>
                            <div className="space-y-6">
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="Enter Room Code" 
                                        value={roomCode} 
                                        onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                                        className="w-full p-4 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all duration-300 text-center text-xl font-mono shadow-sm hover:shadow-md focus:shadow-lg"
                                    />
                                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                        <span className="text-gray-400 text-lg">🔑</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={handleJoinQuiz}
                                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-green-700 hover:to-blue-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                                >
                                    🎯 Join Quiz
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-24 bg-white/50 relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-20">
                        <h2 className="text-5xl font-bold text-gray-900 mb-6">
                            Why Choose <span className="gradient-text">QuizMaster</span>?
                        </h2>
                        <p className="text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                            Experience the next generation of interactive learning and competitive fun
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-12">
                        {features.map((feature, index) => (
                            <div 
                                key={index}
                                className={`text-center p-8 rounded-3xl transition-all duration-500 transform hover:scale-105 ${
                                    currentFeature === index 
                                        ? 'bg-gradient-to-br ' + feature.color + ' shadow-2xl scale-105' 
                                        : 'bg-white/80 backdrop-blur-sm shadow-xl hover:shadow-2xl'
                                }`}
                            >
                                <div className={`w-20 h-20 bg-gradient-to-br ${feature.color} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg ${currentFeature === index ? 'animate-bounce' : ''}`}>
                                    <span className="text-4xl">{feature.icon}</span>
                                </div>
                                <h3 className={`text-2xl font-semibold text-gray-900 mb-4 ${currentFeature === index ? feature.textColor : ''}`}>
                                    {feature.title}
                                </h3>
                                <p className={`text-lg ${currentFeature === index ? feature.textColor : 'text-gray-600'} leading-relaxed`}>
                                    {feature.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Stats Section */}
            <div className="py-24 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="grid md:grid-cols-4 gap-12 text-center">
                        {[
                            { number: '1000+', label: 'Quizzes Created' },
                            { number: '50K+', label: 'Participants' },
                            { number: '99.9%', label: 'Uptime' },
                            { number: '24/7', label: 'Support' }
                        ].map((stat, index) => (
                            <div key={index} className="animate-fadeIn" style={{ animationDelay: `${index * 200}ms` }}>
                                <div className="text-6xl font-bold text-white mb-4 animate-pulse-slow">{stat.number}</div>
                                <div className="text-xl text-blue-100 font-medium">{stat.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-gray-900 text-white py-16 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
                    <div className="grid md:grid-cols-4 gap-12">
                        <div>
                            <h3 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-6">
                                QuizMaster
                            </h3>
                            <p className="text-gray-400 text-lg leading-relaxed">
                                The ultimate platform for creating and participating in interactive quizzes.
                            </p>
                        </div>
                        <div>
                            <h4 className="text-xl font-semibold mb-6 text-white">Features</h4>
                            <ul className="space-y-3 text-gray-400">
                                {['Real-time Scoring', 'Live Leaderboards', 'Countdown Timers', 'Responsive Design'].map((item, index) => (
                                    <li key={index} className="hover:text-white transition-colors duration-200 cursor-pointer">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-xl font-semibold mb-6 text-white">Support</h4>
                            <ul className="space-y-3 text-gray-400">
                                {['Documentation', 'Help Center', 'Contact Us', 'FAQ'].map((item, index) => (
                                    <li key={index} className="hover:text-white transition-colors duration-200 cursor-pointer">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div>
                            <h4 className="text-xl font-semibold mb-6 text-white">Connect</h4>
                            <div className="flex space-x-4">
                                {['📘', '🐦', '💬'].map((icon, index) => (
                                    <button key={index} className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-110 shadow-lg">
                                        {icon}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
                        <p className="text-lg">&copy; 2024 QuizMaster. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
}

export default Home;
