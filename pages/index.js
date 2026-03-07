import { useEffect, useState } from 'react';

const Dashboard = () => {
    const [cards, setCards] = useState(0);
    const [studiedToday, setStudiedToday] = useState(0);
    const [accuracy, setAccuracy] = useState(0);
    const [streak, setStreak] = useState(0);
    const [recentSessions, setRecentSessions] = useState([]);

    useEffect(() => {
        const storedCards = JSON.parse(localStorage.getItem('cards') || '[]');
        const studied = localStorage.getItem('studiedToday') || 0;
        const acc = localStorage.getItem('overallAccuracy') || 0;
        const st = localStorage.getItem('studyStreak') || 0;
        const sessions = JSON.parse(localStorage.getItem('sessionHistory') || '[]');
        
        setCards(storedCards.length);
        setStudiedToday(studied);
        setAccuracy(acc);
        setStreak(st);
        setRecentSessions(sessions.slice(-5));
    }, []);

    return (
        <div className="dashboard">
            <h1>Dashboard</h1>
            <div>Total Cards: {cards}</div>
            <div>Cards Studied Today: {studiedToday}</div>
            <div>Overall Accuracy: {accuracy}%</div>
            <div>Study Streak: {streak}</div>
            <button>Study Mode</button>
            <button>Quiz Mode</button>
            <div>Recent Sessions:</div>
            <ul>
                {recentSessions.map((session, index) => (<li key={index}>{session}</li>))}
            </ul>
        </div>
    );
};

export default Dashboard;
