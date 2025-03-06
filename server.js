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
        let chatMessages = messages || [{ role: 'user', content: req.body.message || 'Hej' }];

        // Lägg till en systeminstruktion för att tvinga språk om language anges
        if (language) {
            chatMessages = [
                { role: 'system', content: `Du är en hjälpsam assistent som alltid svarar på svenska.` },
                ...chatMessages
            ];
        }

        const response = await axios.post(
            'https://api.openai.com/v1/chat/completions',
            {
                model: 'gpt-3.5-turbo',
                messages: chatMessages,
                temperature: 0.7,
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
        console.error('OpenAI API-fel:', error.response?.data || error.message);
        res.status(500).json({ 
            error: 'Något gick fel med OpenAI API',
            details: error.response?.data?.error?.message || error.message 
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server körs på port ${PORT}`);
});
