import { useEffect, useState } from 'react';
import axios from 'axios';

const StudyMode = () => {
    const [cards, setCards] = useState([]);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [answerMode, setAnswerMode] = useState('multiple');

    useEffect(() => {
        const fetchCards = async () => {
            const response = await axios.get('/api/cards');
            setCards(response.data);
        };
        fetchCards();
    }, []);

    const handleNextCard = () => {
        setCurrentCardIndex((prevIndex) => (prevIndex + 1) % cards.length);
    };

    return (
        <div className="study-mode">
            <h1>Study Mode</h1>
            {cards.length > 0 && (
                <div>
                    <div>{cards[currentCardIndex].term}</div>
                    <button onClick={handleNextCard}>Next Card</button>
                </div>
            )}
        </div>
    );
};

export default StudyMode;
