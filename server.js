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
    const { messages } = req.body;

    try {
        // Om inga meddelanden skickas, använd bara det senaste
        let chatMessages = messages || [{ role: 'user', content: req.body.message || 'Hej' }];

        // Lägg till systeminstruktionen
        const systemInstruction = {
            role: 'system',
            content: `Du ska alltid svara på det språk som användaren inleder konversationen med. Om första meddelandet är på svenska, håll dig till svenska. Om det är engelska, håll dig till engelska. Om det är spanska, håll dig till spanska, osv. 
            Byt aldrig språk under en konversation, även om användaren senare skriver på ett annat språk.

            Ditt mål är att:
            - Ställa uttömmande följdfrågor för att få en så komplett bild av användarens behov som möjligt.
            - Ge korta DIY-tips och fråga om användaren tror att de klarar det själv eller vill ha hjälp.
            - Om användaren behöver hjälp, erbjuda att hitta alternativ på företag eller personer som kan hjälpa dem.
            - Om en uppdragsförfrågan skapas, sammanfatta det tydligt och fråga om användaren vill få det skickat till sin e-post.
            - Om en användare lämnar sin e-post, ska du bekräfta detta och meddela att vi återkommer med vidare hjälp.
            - Håll en professionell men vänlig ton och guida användaren smidigt genom konversationen.
            - Anpassa dynamiska rekommendationer baserat på tidigare frågor i chatten.`
        };

        // Lägg till systeminstruktionen i början av messages-arrayen
        chatMessages = [systemInstruction, ...chatMessages];

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
