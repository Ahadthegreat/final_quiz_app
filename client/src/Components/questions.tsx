import { useEffect, useState } from 'react';
import quiz from '../quiz.json';

interface QuestionScore {
    correctCount: number;
    timeTaken: number;
    points: number;
}

interface QuestionsProps {
    timer: number;
    roomCode: string;
}

function Questions({ timer, roomCode }: QuestionsProps) {
    const [score, setScore] = useState<QuestionScore>({
        correctCount: 0,
        timeTaken: 0,
        points: 0
    });
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [playerId, setPlayerId] = useState<string>('');
    const [questionStartTime, setQuestionStartTime] = useState<number>(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    
    const quiz_arr = quiz;
    const totalQuestions = quiz_arr.length;

    // Initialize selected answers array and generate player ID
    useEffect(() => {
        setSelectedAnswers(new Array(totalQuestions).fill(-1));
        // Generate unique player ID if not exists
        if (!playerId) {
            const storedId = sessionStorage.getItem('playerId');
            if (storedId) {
                setPlayerId(storedId);
            } else {
                const newId = Math.random().toString(36).substring(2, 15);
                setPlayerId(newId);
                sessionStorage.setItem('playerId', newId);
            }
        }
    }, [totalQuestions, playerId]);

    // Set question start time when question changes
    useEffect(() => {
        setQuestionStartTime(Date.now());
    }, [currentQuestionIndex]);

    const currentQuestion = quiz_arr[currentQuestionIndex];

    const handleOptionSelect = (optionIndex: number) => {
        const newAnswers = [...selectedAnswers];
        newAnswers[currentQuestionIndex] = optionIndex;
        setSelectedAnswers(newAnswers);
        
        // Don't submit score immediately - just store the selection
        // Score will be submitted when user clicks Next or navigates to another question
    };

    const submitQuestionScore = async (selectedAnswer: number) => {
        if (!playerId || !currentQuestion) return;

        const questionTime = Date.now() - questionStartTime;
        const correctAnswerIndex = currentQuestion.q_ans.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0);

        try {
            console.log('Submitting question score:', {
                questionIndex: currentQuestionIndex,
                selectedAnswer,
                correctAnswer: correctAnswerIndex,
                timeTaken: questionTime,
                roomCode: roomCode,
                playerId: playerId
            });

            const response = await fetch('http://localhost:3000/submit-score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    questionIndex: currentQuestionIndex,
                    selectedAnswer,
                    correctAnswer: correctAnswerIndex,
                    timeTaken: questionTime,
                    roomCode: roomCode,
                    playerId: playerId
                }),
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Question score submitted successfully:', data);
                
                // Show success notification
                setNotification({
                    message: `Score submitted! ${data.isCorrect ? 'Correct!' : 'Incorrect'} (+${data.questionPoints} points)`,
                    type: 'success'
                });
                
                // Clear notification after 3 seconds
                setTimeout(() => setNotification(null), 3000);
                
                // Update local score state
                setScore(prev => ({
                    correctCount: data.isCorrect ? prev.correctCount + 1 : prev.correctCount,
                    timeTaken: prev.timeTaken + questionTime,
                    points: data.totalPoints
                }));
            } else {
                const errorData = await response.json();
                console.error('Failed to submit question score:', errorData);
                
                // Show error notification
                setNotification({
                    message: 'Failed to submit score. Please try again.',
                    type: 'error'
                });
                
                // Clear notification after 3 seconds
                setTimeout(() => setNotification(null), 3000);
            }
        } catch (error) {
            console.error('Error submitting question score:', error);
            
            // Show error notification
            setNotification({
                message: 'Network error. Please check your connection.',
                type: 'error'
            });
            
            // Clear notification after 3 seconds
            setTimeout(() => setNotification(null), 3000);
        }
    };

    const goToQuestion = async (index: number) => {
        if (index >= 0 && index < totalQuestions) {
            // If we have a selected answer for the current question and haven't submitted it yet
            if (selectedAnswers[currentQuestionIndex] !== -1) {
                // Submit the score for the current question before moving
                await submitQuestionScore(selectedAnswers[currentQuestionIndex]);
            }
            
            // Move to the new question
            setCurrentQuestionIndex(index);
        }
    };

    const handleFinalSubmit = async () => {
        setIsSubmitting(true);
        
        // First, submit the score for the last question if it hasn't been submitted yet
        if (selectedAnswers[currentQuestionIndex] !== -1) {
            try {
                await submitQuestionScore(selectedAnswers[currentQuestionIndex]);
            } catch (error) {
                console.error('Failed to submit last question score:', error);
                // Continue with final submission even if last question fails
            }
        }
        
        // Calculate final stats
        const correctCount = selectedAnswers.reduce((count, selectedAnswer, index) => {
            const question = quiz_arr[index];
            if (question && selectedAnswer !== -1) {
                const correctAnswerIndex = question.q_ans.toLowerCase().charCodeAt(0) - 'a'.charCodeAt(0);
                if (selectedAnswer === correctAnswerIndex) {
                    return count + 1;
                }
            }
            return count;
        }, 0);

        const totalTimeTaken = timer;

        try {
            // Submit final score to server
            const response = await fetch('http://localhost:3000/submit-final-score', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    correctCount,
                    timeTaken: totalTimeTaken,
                    roomCode: roomCode,
                    playerId: playerId
                }),
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Final score submitted:', data);
                
                // Show success notification
                setNotification({
                    message: 'Quiz completed successfully! Your score has been submitted to the leaderboard.',
                    type: 'success'
                });
                
                // Clear notification after 5 seconds
                setTimeout(() => setNotification(null), 5000);
                
                setIsSubmitted(true);
                setShowResults(true);
            } else {
                const errorData = await response.json();
                console.error('Final score submission failed:', errorData);
                
                // Show error notification
                setNotification({
                    message: `Failed to submit final score: ${errorData.error || 'Unknown error'}`,
                    type: 'error'
                });
                
                // Clear notification after 5 seconds
                setTimeout(() => setNotification(null), 5000);
                
                alert(`Failed to submit final score: ${errorData.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error submitting final score:', error);
            
            // Show error notification
            setNotification({
                message: 'Network error submitting final score. Please try again.',
                type: 'error'
            });
            
            // Clear notification after 5 seconds
            setTimeout(() => setNotification(null), 5000);
            
            alert('Error submitting final score. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (showResults) {
        return (
            <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
                {/* Success notification for quiz completion */}
                {notification && (
                    <div className={`mb-6 p-4 rounded-lg ${
                        notification.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
                        notification.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' : 
                        'bg-blue-100 text-blue-800 border border-blue-200'
                    }`}>
                        {notification.message}
                    </div>
                )}
                
                <div className="mb-8">
                    <div className="w-24 h-24 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6">
                        <span className="text-5xl">🎉</span>
                    </div>
                    <h2 className="text-4xl font-bold text-gray-800 mb-4">Quiz Completed!</h2>
                    <p className="text-xl text-gray-600">Congratulations on finishing the quiz!</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-6 rounded-xl">
                        <div className="text-3xl font-bold text-blue-600 mb-2">{score.points}</div>
                        <div className="text-blue-800 font-semibold">Total Points</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-100 to-green-200 p-6 rounded-xl">
                        <div className="text-3xl font-bold text-green-600 mb-2">{score.correctCount}/{totalQuestions}</div>
                        <div className="text-green-800 font-semibold">Correct Answers</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-6 rounded-xl">
                        <div className="text-3xl font-bold text-purple-600 mb-2">{Math.floor(score.timeTaken / 1000)}s</div>
                        <div className="text-purple-800 font-semibold">Total Time</div>
                    </div>
                </div>
                
                <div className="bg-gray-50 rounded-xl p-6">
                    <p className="text-gray-700 text-lg">
                        Your score has been submitted to the leaderboard! 🏆
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl shadow-xl p-8">
            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-lg font-semibold text-gray-700">
                        Question {currentQuestionIndex + 1} of {totalQuestions}
                    </span>
                    <span className="text-lg font-semibold text-gray-700">
                        {Math.round(((currentQuestionIndex + 1) / totalQuestions) * 100)}%
                    </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
                    ></div>
                </div>
            </div>

            {/* Current Score Display */}
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
                <div className="flex justify-between items-center">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{score.points}</div>
                        <div className="text-sm text-blue-700">Points</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{score.correctCount}/{currentQuestionIndex + 1}</div>
                        <div className="text-sm text-green-700">Correct</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{Math.floor(score.timeTaken / 1000)}s</div>
                        <div className="text-sm text-purple-700">Time</div>
                    </div>
                </div>
                
                {/* Real-time indicator */}
                <div className="mt-3 text-center">
                    <div className="flex items-center justify-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-xs text-green-700 font-medium">Live scoring active</span>
                    </div>
                </div>
                
                {/* Answer submission status */}
                {selectedAnswers[currentQuestionIndex] !== -1 && (
                    <div className="mt-3 text-center">
                        <div className="flex items-center justify-center space-x-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <span className="text-xs text-yellow-700 font-medium">Answer selected - Click Next to submit</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Question Navigation */}
            <div className="flex flex-wrap gap-2 mb-8 justify-center">
                {quiz_arr.map((_, index) => {
                    // Determine the state of each question
                    let buttonClass = 'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 ';
                    
                    if (index === currentQuestionIndex) {
                        buttonClass += 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg';
                    } else if (selectedAnswers[index] !== -1) {
                        // Check if this question's score has been submitted
                        // We'll track submitted questions separately
                        const isSubmitted = index < currentQuestionIndex; // Questions before current are submitted
                        if (isSubmitted) {
                            buttonClass += 'bg-green-100 text-green-800 border-2 border-green-300 hover:bg-green-200';
                        } else {
                            buttonClass += 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300 hover:bg-yellow-200';
                        }
                    } else {
                        buttonClass += 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-2 border-gray-300';
                    }
                    
                    return (
                        <button
                            key={index}
                            onClick={() => goToQuestion(index)}
                            className={buttonClass}
                            title={
                                index === currentQuestionIndex 
                                    ? 'Current Question' 
                                    : selectedAnswers[index] !== -1 
                                        ? index < currentQuestionIndex 
                                            ? 'Answer Submitted' 
                                            : 'Answer Selected (Not Submitted)'
                                        : 'Not Answered'
                            }
                        >
                            {index + 1}
                        </button>
                    );
                })}
            </div>

            {/* Question Navigation Legend */}
            <div className="mb-6 text-center">
                <div className="inline-flex items-center space-x-4 text-xs text-gray-600">
                    <span className="flex items-center">
                        <div className="w-3 h-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded mr-2"></div>
                        Current Question
                    </span>
                    <span className="flex items-center">
                        <div className="w-3 h-3 bg-green-100 border-2 border-green-300 rounded mr-2"></div>
                        Answer Submitted
                    </span>
                    <span className="flex items-center">
                        <div className="w-3 h-3 bg-yellow-100 border-2 border-yellow-300 rounded mr-2"></div>
                        Answer Selected (Not Submitted)
                    </span>
                    <span className="flex items-center">
                        <div className="w-3 h-3 bg-gray-100 border-2 border-gray-300 rounded mr-2"></div>
                        Not Answered
                    </span>
                </div>
            </div>

            {/* Current Question */}
            {currentQuestion && (
                <div className="mb-8">
                    <div className="mb-6">
                        <span className="inline-block bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full mb-3">
                            Question {currentQuestionIndex + 1}
                        </span>
                        <h3 className="text-2xl font-bold text-gray-800 leading-relaxed">
                            {currentQuestion.q_title}
                        </h3>
                    </div>

                    {/* Options */}
                    <div className="space-y-4">
                        {/* Instructions */}
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-700 text-center">
                                💡 <strong>Tip:</strong> Select your answer below, then click <strong>Next</strong> to submit and move to the next question. 
                                Your score will only be calculated when you navigate to the next question.
                            </p>
                        </div>
                        
                        {currentQuestion.q_options.map((option, index) => (
                            <label
                                key={index}
                                className={`flex items-center p-5 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg transform hover:scale-[1.02] ${
                                    selectedAnswers[currentQuestionIndex] === index
                                        ? 'border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50 shadow-lg'
                                        : 'border-gray-200 hover:border-blue-300 bg-white'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name={`question-${currentQuestionIndex}`}
                                    checked={selectedAnswers[currentQuestionIndex] === index}
                                    onChange={() => handleOptionSelect(index)}
                                    className="sr-only"
                                />
                                <div className={`w-6 h-6 rounded-full border-2 mr-4 flex items-center justify-center ${
                                    selectedAnswers[currentQuestionIndex] === index
                                        ? 'border-blue-500 bg-blue-500'
                                        : 'border-gray-300'
                                }`}>
                                    {selectedAnswers[currentQuestionIndex] === index && (
                                        <div className="w-3 h-3 bg-white rounded-full"></div>
                                    )}
                                </div>
                                <span className="text-gray-700 font-medium text-lg">{option}</span>
                            </label>
                        ))}
                    </div>
                </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center">
                <button
                    onClick={() => goToQuestion(currentQuestionIndex - 1)}
                    disabled={currentQuestionIndex === 0}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 ${
                        currentQuestionIndex === 0
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-gray-500 text-white hover:bg-gray-600 shadow-lg hover:shadow-xl'
                    }`}
                >
                    ← Previous
                </button>

                {currentQuestionIndex < totalQuestions - 1 ? (
                    <button
                        onClick={() => goToQuestion(currentQuestionIndex + 1)}
                        disabled={selectedAnswers[currentQuestionIndex] === -1}
                        className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 ${
                            selectedAnswers[currentQuestionIndex] === -1
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 shadow-lg hover:shadow-xl'
                        }`}
                    >
                        {selectedAnswers[currentQuestionIndex] !== -1 ? 'Submit & Next →' : 'Next →'}
                    </button>
                ) : (
                    <button
                        onClick={handleFinalSubmit}
                        disabled={selectedAnswers.some(answer => answer === -1) || isSubmitting}
                        className={`px-8 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 ${
                            selectedAnswers.some(answer => answer === -1) || isSubmitting
                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-green-500 to-blue-500 text-white hover:from-green-600 hover:to-blue-600 shadow-lg hover:shadow-xl'
                        }`}
                    >
                        {isSubmitting ? (
                            <div className="flex items-center">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Submitting...
                            </div>
                        ) : (
                            '🏁 Submit Quiz'
                        )}
                    </button>
                )}
            </div>

            {/* Completion Status */}
            <div className="mt-8 text-center">
                <div className="inline-block bg-gray-100 px-4 py-2 rounded-full">
                    <span className="text-sm font-medium text-gray-700">
                        {selectedAnswers.filter(answer => answer !== -1).length} of {totalQuestions} questions answered
                    </span>
                </div>
            </div>

            {/* Notification Display */}
            {notification && (
                <div className={`fixed bottom-4 left-1/2 -translate-x-1/2 p-3 rounded-lg shadow-lg ${
                    notification.type === 'success' ? 'bg-green-500 text-white' :
                    notification.type === 'error' ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
                }`}>
                    {notification.message}
                </div>
            )}
        </div>
    );
}

export default Questions;
