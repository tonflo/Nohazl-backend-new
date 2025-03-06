const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// CORS för att tillåta frontend-anrop
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:8000');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

app.options('/api/chat', (req, res) => {
    res.header('Access-Control-Allow-Origin', 'http://localhost:8000');
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    res.sendStatus(200);
});

app.post('/api/chat', async (req, res) => {
    const { messages, language } = req.body;

    try {
        // Om inga meddelanden skickas, använd bara det senaste
        const chatMessages = messages || [{ role: 'user', content: req.body.message || 'Hej' }];

        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: chatMessages,
                temperature: 0.7,
                // Tvinga språk om specificerat (valfritt, kan förbättras med språkmodell)
                ...(language && { prompt: `Svara på ${language}` }),
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                },
            }
        );

        const aiResponse = response.data.choices[0].message.content;
        res.json({ response: aiResponse });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Något gick fel med OpenAI API' });
    }
});

app.listen(PORT, () => {
    console.log(`Server körs på port ${PORT}`);
});
