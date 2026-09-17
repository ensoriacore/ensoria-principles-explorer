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

// Dynamic Timeline Generation based on principle creation dates
apiRouter.get('/timeline', (req, res) => {
    try {
        const parser = require('./lib/parser');
        const data = parser.getAllPrinciples();
        
        // Extract unique years from created_at dates
        const years = new Set();
        data.principles.forEach(p => {
            if (p.created_at) {
                years.add(p.created_at.split('-')[0]);
            }
        });
        
        const sortedYears = Array.from(years).sort();
        
        // Group principles by year
        const epochs = sortedYears.map((year, index) => {
            const principlesForYear = data.principles
                .filter(p => p.created_at && p.created_at.startsWith(year))
                .sort((a, b) => a.created_at.localeCompare(b.created_at))
                .map(p => p.id);
                
            return {
                id: `epoch_${year}`,
                name: `Ensoria Core ${year}`,
                period: year,
                description: `Ontological principles codified during the ${year} operating period.`,
                principles: principlesForYear
            };
        });

        res.json({
            success: true,
            totalEpochs: epochs.length,
            epochs: epochs
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
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

app.use('/api', apiRouter);

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`[ensoria-principles-explorer] Listening standalone on http://0.0.0.0:${PORT}`);
    });
}

module.exports = app;
