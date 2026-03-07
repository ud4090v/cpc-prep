import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { mode, cardCount } = req.body;
        const { data, error } = await supabase
            .from('sessions')
            .insert([{ mode, card_count: cardCount }]);

        if (error) return res.status(500).json({ error });
        return res.status(201).json(data);
    } else if (req.method === 'PATCH') {
        const { id, scorePct } = req.body;
        const { data, error } = await supabase
            .from('sessions')
            .update({ score_pct: scorePct })
            .eq('id', id);

        if (error) return res.status(500).json({ error });
        return res.status(200).json(data);
    } else {
        res.setHeader('Allow', ['POST', 'PATCH']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
