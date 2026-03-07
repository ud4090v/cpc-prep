import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { sessionId } = req.body;
        const { data: answers, error: fetchError } = await supabase
            .from('answers')
            .select('*')
            .eq('session_id', sessionId);

        if (fetchError) return res.status(500).json({ error: fetchError });

        const analysis = await openai.createChatCompletion({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: `Analyze these answers: ${JSON.stringify(answers)}` }]
        });

        const analysisResponse = analysis.data.choices[0].message.content;

        res.status(200).json({ analysis: analysisResponse });
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
