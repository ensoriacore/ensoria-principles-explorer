const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const apiRouter = express.Router();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// API: Server Status
apiRouter.get('/status', (req, res) => {
    res.json({
        status: 'OPERATING',
        version: '1.0.0-somatic-avatar',
        timestamp: new Date().toISOString()
    });
});

// API: Get Somatic Centers
apiRouter.get('/centers', (req, res) => {
    res.json({
        totalCenters: 3,
        centers: [
            { id: 'brain', y: 1.85, chakra: 'Sahasrara & Ajna', color: '#38bdf8' },
            { id: 'soul', y: 0.45, chakra: 'Anahata', color: '#c084fc' },
            { id: 'body', y: -0.75, chakra: 'Muladhara', color: '#34d399' }
        ]
    });
});

// API: Get All Principles
apiRouter.get('/principles', (req, res) => {
    try {
        const parser = require('./lib/parser');
        const data = parser.getAllPrinciples();
        res.json(data);
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// API: Get Single Principle by Slug
apiRouter.get('/principles/:id', (req, res) => {
    try {
        const parser = require('./lib/parser');
        const data = parser.getAllPrinciples();
        const principle = data.principles.find(p => p.slug === req.params.id);
        if (principle) {
            res.json({ success: true, principle });
        } else {
            res.status(404).json({ success: false, error: 'Principle not found' });
        }
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

app.use('/api', apiRouter);

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`[ensoria-principles-explorer] Listening standalone on http://0.0.0.0:${PORT}`);
    });
}

module.exports = app;
