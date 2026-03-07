import { useEffect, useState } from 'react';

const Progress = () => {
    const [totalSessions, setTotalSessions] = useState(0);
    const [avgScore, setAvgScore] = useState(0);
    const [masteredCards, setMasteredCards] = useState(0);
    const [weakCards, setWeakCards] = useState([]);

    useEffect(() => {
        const sessions = JSON.parse(localStorage.getItem('sessionHistory') || '[]');
        const total = sessions.length;
        const scores = sessions.map(session => session.score);
        const avg = scores.reduce((a, b) => a + b, 0) / total;
        const mastered = sessions.filter(session => session.score > 80).length;
        const weak = sessions.filter(session => session.score < 50).slice(0, 10);

        setTotalSessions(total);
        setAvgScore(avg);
        setMasteredCards(mastered);
        setWeakCards(weak);
    }, []);

    return (
        <div className="progress">
            <h1>Progress</h1>
            <div>Total Sessions: {totalSessions}</div>
            <div>Average Score: {avgScore}%</div>
            <div>Mastered Cards: {masteredCards}</div>
            <div>Weak Cards:</div>
            <ul>{weakCards.map((card, index) => (<li key={index}>{card.term}</li>))}</ul>
        </div>
    );
};

export default Progress;
