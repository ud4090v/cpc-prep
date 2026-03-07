import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { sessionId, cardId, userAnswer, isCorrect } = req.body;
        const { data, error } = await supabase
            .from('answers')
            .insert([{ session_id: sessionId, card_id: cardId, user_answer: userAnswer, is_correct: isCorrect }]);

        if (error) return res.status(500).json({ error });
        res.status(201).json(data);
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
