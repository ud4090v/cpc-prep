import cards from '../../data/cards.json';

export default function handler(req, res) {
    const { system, category, limit } = req.query;

    let filteredCards = cards;
    
    if (system) {
        filteredCards = filteredCards.filter(card => card.system.toLowerCase() === system.toLowerCase());
    }
    if (category) {
        filteredCards = filteredCards.filter(card => card.category === category);
    }

    // Shuffle using Fisher-Yates algorithm
    for (let i = filteredCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [filteredCards[i], filteredCards[j]] = [filteredCards[j], filteredCards[i]];
    }

    if (limit) {
        filteredCards = filteredCards.slice(0, parseInt(limit));
    }

    res.status(200).json(filteredCards);
}
