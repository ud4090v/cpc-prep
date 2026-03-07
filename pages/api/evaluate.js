import { Configuration, OpenAIApi } from 'openai';

const openai = new OpenAIApi(new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
}));

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { cardId, userAnswer, correctAnswer, term } = req.body;

        const evaluationResult = await openai.createChatCompletion({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: `Evaluate the answer: ${userAnswer} for card: ${term}. Correct answer is: ${correctAnswer}` }]
        });

        const feedback = evaluationResult.data.choices[0].message.content;

        res.status(200).json({
            isCorrect: userAnswer.toLowerCase() === correctAnswer.toLowerCase(),
            confidence: 'high',  // Placeholder for actual confidence assessment
            feedback: feedback,
            explanation: feedback  // Assuming the feedback contains an explanation as well
        });
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
