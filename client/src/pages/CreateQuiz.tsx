import React, { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';

function CreateQuiz() {
    const [quizTitle, setQuizTitle] = useState('');
    const [quizDescription, setQuizDescription] = useState('');
    const [quizStartTime, setQuizStartTime] = useState('');
    const [createdQuiz, setCreatedQuiz] = useState<{ roomCode: string } | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (!quizTitle || !quizDescription) {
            alert("Please fill in all fields");
            return;
        }
        
        setIsSubmitting(true);
        
        try{
            const res = await fetch('http://localhost:3000/create-quiz', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ title: quizTitle, description: quizDescription, startTime: quizStartTime }),
            });

            if(res.ok){
                const data = await res.json();
                setCreatedQuiz(data);
                alert(`Quiz created successfully! Room Code: ${data.roomCode}`);
                // Reset form fields
                setQuizTitle('');
                setQuizDescription('');
                setQuizStartTime('');
            }else{
                alert("Failed to create quiz. Please try again.");
            }
        }catch (error) {
            console.log("Error creating quiz:", error);
            alert("An error occurred while creating the quiz. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Navigation */}
            <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <Link to="/" className="flex-shrink-0 hover:scale-105 transition-transform duration-200">
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                    QuizMaster
                                </h1>
                            </Link>
                        </div>
                        <div className="flex items-center space-x-4">
                            <Link to="/" className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 hover:bg-blue-50">
                                Home
                            </Link>
                            <Link to="/create-quiz" className="text-blue-600 font-medium px-3 py-2 rounded-md text-sm bg-blue-50 rounded-lg">
                                Create Quiz
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {createdQuiz ? (
                    <div className="text-center animate-fadeIn">
                        <div className="mb-8">
                            <div className="w-24 h-24 bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce">
                                <span className="text-5xl">✅</span>
                            </div>
                            <h1 className="text-4xl font-bold text-gray-900 mb-4 animate-slideUp">Quiz Created Successfully!</h1>
                            <p className="text-xl text-gray-600 mb-8 animate-slideUp animation-delay-200">
                                Your quiz is ready and waiting for participants to join.
                            </p>
                        </div>

                        <div className="bg-white rounded-2xl shadow-xl p-8 mb-8 max-w-md mx-auto border border-gray-100 animate-slideUp animation-delay-400">
                            <h2 className="text-2xl font-bold text-gray-800 mb-4">Room Code</h2>
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-xl mb-6 border-2 border-dashed border-gray-300">
                                <code className="text-4xl font-mono font-bold text-gray-800 tracking-wider select-all">
                                    {createdQuiz.roomCode}
                                </code>
                            </div>
                            <p className="text-gray-600 mb-6">
                                Share this code with participants so they can join your quiz.
                            </p>
                            <Link to={`/take-quiz/${createdQuiz.roomCode}`}>
                                <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                                    🎯 Go to Quiz Room
                                </button>
                            </Link>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slideUp animation-delay-600">
                            <button 
                                onClick={() => setCreatedQuiz(null)}
                                className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-3 rounded-lg font-semibold hover:from-gray-700 hover:to-gray-800 transition-all duration-200 transform hover:scale-105 shadow-md"
                            >
                                Create Another Quiz
                            </button>
                            <Link to="/">
                                <button className="border-2 border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:border-blue-500 hover:text-blue-600 transition-all duration-200 transform hover:scale-105 hover:bg-blue-50">
                                    Back to Home
                                </button>
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="text-center mb-12 animate-fadeIn">
                        <div className="mb-8">
                            <div className="w-20 h-20 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                                <span className="text-4xl">📝</span>
                            </div>
                            <h1 className="text-5xl font-bold text-gray-900 mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                Create Your Quiz
                            </h1>
                            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
                                Set up an interactive quiz with custom timing, descriptions, and real-time scoring.
                            </p>
                        </div>

                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-10 border border-white/20">
                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="group">
                                    <label className="block text-sm font-semibold text-gray-700 mb-3 text-left">
                                        Quiz Title *
                                    </label>
                                    <input 
                                        value={quizTitle} 
                                        onChange={(e) => setQuizTitle(e.target.value)} 
                                        type="text" 
                                        className="w-full p-5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all duration-300 text-lg shadow-sm hover:shadow-md focus:shadow-lg group-hover:border-blue-300" 
                                        placeholder="Enter an engaging quiz title"
                                        required
                                    />
                                </div>

                                <div className="group">
                                    <label className="block text-sm font-semibold text-gray-700 mb-3 text-left">
                                        Description *
                                    </label>
                                    <textarea 
                                        value={quizDescription} 
                                        onChange={(e) => setQuizDescription(e.target.value)} 
                                        className="w-full p-5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all duration-300 text-lg resize-none shadow-sm hover:shadow-md focus:shadow-lg group-hover:border-blue-300" 
                                        placeholder="Describe what your quiz is about"
                                        rows={4}
                                        required
                                    />
                                </div>

                                <div className="group">
                                    <label className="block text-sm font-semibold text-gray-700 mb-3 text-left">
                                        Start Time
                                    </label>
                                    <input 
                                        value={quizStartTime} 
                                        onChange={(e) => setQuizStartTime(e.target.value)} 
                                        type="datetime-local" 
                                        className="w-full p-5 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:outline-none transition-all duration-300 text-lg shadow-sm hover:shadow-md focus:shadow-lg group-hover:border-blue-300" 
                                    />
                                    <p className="text-sm text-gray-500 mt-3 text-left">
                                        Leave empty to start immediately, or set a future time for scheduled quizzes.
                                    </p>
                                </div>

                                <div className="pt-6">
                                    <button 
                                        type="submit" 
                                        disabled={isSubmitting}
                                        className={`w-full py-5 rounded-xl font-semibold text-lg transition-all duration-300 transform hover:scale-105 ${
                                            isSubmitting 
                                                ? 'bg-gray-400 cursor-not-allowed' 
                                                : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-2xl'
                                        } text-white`}
                                    >
                                        {isSubmitting ? (
                                            <div className="flex items-center justify-center">
                                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                                                Creating Quiz...
                                            </div>
                                        ) : (
                                            '🚀 Create Quiz'
                                        )}
                                    </button>
                                </div>
                            </form>

                            <div className="mt-10 pt-8 border-t border-gray-200">
                                <div className="text-center">
                                    <p className="text-gray-600 mb-6">Need help getting started?</p>
                                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                        <button className="text-blue-600 hover:text-blue-800 font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2">
                                            <span>📖</span> View Documentation
                                        </button>
                                        <button className="text-blue-600 hover:text-blue-800 font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2">
                                            <span>🎥</span> Watch Tutorial
                                        </button>
                                        <button className="text-blue-600 hover:text-blue-800 font-medium transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2">
                                            <span>💬</span> Contact Support
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CreateQuiz;
