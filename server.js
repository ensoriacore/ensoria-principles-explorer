const express = require('express');
const path = require('path');
const fs = require('fs');
const parser = require('./lib/parser');
const i18n = require('./lib/i18n');

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

// API: Get i18n Strings
apiRouter.get('/i18n/:lang', (req, res) => {
    try {
        const lang = req.params.lang || 'it';
        const strings = i18n.getUIStrings(lang);
        res.json({
            success: true,
            lang: i18n.normalizeLang(lang),
            strings
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// API: Get Somatic Centers
apiRouter.get('/centers', (req, res) => {
    try {
        const lang = req.query.lang || 'it';
        const data = parser.getAllPrinciples();
        
        // Count principles dynamically
        const brainCount = data.domains.brain.principlesCount;
        const soulCount = data.domains.soul.principlesCount;
        const bodyCount = data.domains.body.principlesCount;
        
        const rawCenters = [
            { id: 'brain', y: 1.85, chakra: 'Sahasrara & Ajna', color: '#38bdf8', symbol: '🧠', principlesCount: brainCount },
            { id: 'soul', y: 0.45, chakra: 'Anahata', color: '#c084fc', symbol: '💜', principlesCount: soulCount },
            { id: 'body', y: -0.75, chakra: 'Muladhara', color: '#34d399', symbol: '⚡', principlesCount: bodyCount }
        ];

        const centers = rawCenters.map(c => i18n.localizeCenter(c, lang));

        res.json({
            success: true,
            totalCenters: 3,
            centers
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// API: Get All Principles
apiRouter.get('/principles', (req, res) => {
    try {
        const lang = req.query.lang || 'it';
        const data = parser.getAllPrinciples();

        const localizedPrinciples = data.principles.map(p => i18n.localizePrinciple(p, lang));

        const localizedDomains = {};
        for (const [dKey, dVal] of Object.entries(data.domains)) {
            const locCenter = i18n.getLocalizedCenter(dKey, lang);
            localizedDomains[dKey] = {
                ...dVal,
                name: locCenter?.name || dVal.name,
                chakra: locCenter?.chakra || dVal.chakra,
                description: locCenter?.description || dVal.description,
                slogan: locCenter?.slogan || "",
                quote: locCenter?.quote || "",
                principles: localizedPrinciples.filter(p => p.domain === dKey)
            };
        }

        res.json({
            success: true,
            totalPrinciples: localizedPrinciples.length,
            domains: localizedDomains,
            principles: localizedPrinciples,
            timestamp: data.timestamp
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// API: Get Single Principle by Slug
apiRouter.get('/principles/:id', (req, res) => {
    try {
        const lang = req.query.lang || 'it';
        const data = parser.getAllPrinciples();
        const rawPrinciple = data.principles.find(p => p.slug === req.params.id);
        if (rawPrinciple) {
            const principle = i18n.localizePrinciple(rawPrinciple, lang);
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
