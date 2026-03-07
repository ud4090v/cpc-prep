import { useEffect, useState } from 'react';
import axios from 'axios';

const QuizMode = () => {
    const [questions, setQuestions] = useState([]);
    const [questionIndex, setQuestionIndex] = useState(0);
    const [timeRemaining, setTimeRemaining] = useState(90);

    useEffect(() => {
        const fetchQuestions = async () => {
            const response = await axios.get('/api/cards');
            setQuestions(response.data);
        };
        fetchQuestions();
        const timer = setInterval(() => { setTimeRemaining((time) => time - 1); }, 1000);
        return () => clearInterval(timer);
    }, []);

    const handleNextQuestion = () => {
        setQuestionIndex((prevIndex) => (prevIndex + 1) % questions.length);
    };

    return (
        <div className="quiz-mode">
            <h1>Quiz Mode</h1>
            {questions.length > 0 && (
                <div>
                    <div>Question {questionIndex + 1} of {questions.length}</div>
                    <div>{questions[questionIndex].term}</div>
                    <button onClick={handleNextQuestion}>Next Question</button>
                    <div>Time Remaining: {timeRemaining} seconds</div>
                </div>
            )}
        </div>
    );
};

export default QuizMode;
