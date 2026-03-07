import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
    if (req.method === 'GET') {
        const { data: sessions, error } = await supabase
            .from('sessions')
            .select('*');

        if (error) return res.status(500).json({ error });

        const totalSessions = sessions.length;
        const avgScore = sessions.reduce((sum, session) => sum + session.score_pct, 0) / totalSessions;
        const perSystemAccuracy = {};  // Logic for calculating accuracy per system can be added here

        res.status(200).json({ totalSessions, avgScore, perSystemAccuracy });
    } else {
        res.setHeader('Allow', ['GET']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
