const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const parser = require('./lib/parser');
const i18n = require('./lib/i18n');

const app = express();
app.use(cors());
app.use(express.json());

// API Endpoints
const apiRouter = express.Router();

// Get UI i18n translations
apiRouter.get('/i18n/:lang?', (req, res) => {
    try {
        const lang = i18n.normalizeLang(req.params.lang || req.query.lang);
        const strings = i18n.getUIStrings(lang);
        res.json({
            success: true,
            lang,
            strings
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get all principles, domains, and somatic centers (with optional ?lang=it|en|es)
apiRouter.get('/principles', (req, res) => {
    try {
        const lang = i18n.normalizeLang(req.query.lang);
        const data = parser.getAllPrinciples();
        
        // Localize principles
        const localizedPrinciples = data.principles.map(p => i18n.localizePrinciple(p, lang));
        
        // Localize domains
        const localizedDomains = {};
        for (const [key, d] of Object.entries(data.domains)) {
            const locCenter = i18n.localizeCenter({ id: key, ...d }, lang);
            localizedDomains[key] = {
                ...d,
                name: locCenter.name,
                description: locCenter.description,
                principles: d.principles.map(p => i18n.localizePrinciple(p, lang))
            };
        }

        res.json({
            success: true,
            lang,
            totalPrinciples: localizedPrinciples.length,
            domains: localizedDomains,
            principles: localizedPrinciples
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get a single principle by ID/slug
apiRouter.get('/principles/:id', (req, res) => {
    try {
        const lang = i18n.normalizeLang(req.query.lang);
        const rawPrinciple = parser.getPrincipleById(req.params.id);
        if (!rawPrinciple) {
            return res.status(404).json({ success: false, error: `Principle '${req.params.id}' not found` });
        }
        const principle = i18n.localizePrinciple(rawPrinciple, lang);
        res.json({
            success: true,
            lang,
            principle
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get somatic centers metadata & principles for 3D avatar & graph
apiRouter.get('/centers', (req, res) => {
    try {
        const lang = i18n.normalizeLang(req.query.lang);
        const data = parser.getAllPrinciples();
        
        const rawCenters = [
            {
                id: 'brain',
                domain: 'brain',
                name: 'Brain (Cranial Center)',
                slogan: 'Cognitive Engine & Epistemology',
                chakra: 'Sahasrara & Ajna (Crown / Third Eye)',
                symbol: '🧠',
                color: '#38bdf8', // Neon Cyan
                wireframeColor: '#0284c7',
                somaticPosition: { x: 0, y: 1.85, z: 0 },
                cameraFocus: { x: 0, y: 1.85, z: 4.5 },
                description: data.domains.brain.description,
                principlesCount: data.domains.brain.principlesCount,
                principles: data.domains.brain.principles.map(p => i18n.localizePrinciple(p, lang))
            },
            {
                id: 'soul',
                domain: 'soul',
                name: 'Soul (Cardiac Center)',
                slogan: 'Ethical Core, Lineage & Dignity',
                chakra: 'Anahata (Heart Chakra)',
                symbol: '💜',
                color: '#c084fc', // Neon Amethyst
                wireframeColor: '#9333ea',
                somaticPosition: { x: 0, y: 0.45, z: 0 },
                cameraFocus: { x: 0, y: 0.45, z: 5.0 },
                description: data.domains.soul.description,
                principlesCount: data.domains.soul.principlesCount,
                principles: data.domains.soul.principles.map(p => i18n.localizePrinciple(p, lang))
            },
            {
                id: 'body',
                domain: 'body',
                name: 'Body (Root Chakra & Spine)',
                slogan: 'Physical Silicon, Zero-Trust & Healing',
                chakra: 'Muladhara (Root Chakra / Spine)',
                symbol: '⚡',
                color: '#34d399', // Neon Emerald
                wireframeColor: '#059669',
                somaticPosition: { x: 0, y: -0.75, z: 0 },
                cameraFocus: { x: 0, y: -0.75, z: 4.8 },
                description: data.domains.body.description,
                principlesCount: data.domains.body.principlesCount,
                principles: data.domains.body.principles.map(p => i18n.localizePrinciple(p, lang))
            }
        ];

        const centers = rawCenters.map(c => i18n.localizeCenter(c, lang));

        res.json({
            success: true,
            lang,
            totalCenters: centers.length,
            centers
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// Get temporal epochs timeline
apiRouter.get('/timeline', (req, res) => {
    try {
        const timelinePath = path.join(__dirname, 'data', 'timeline.json');
        if (!fs.existsSync(timelinePath)) {
            return res.status(404).json({ success: false, error: 'timeline.json not found' });
        }
        const timeline = JSON.parse(fs.readFileSync(timelinePath, 'utf8'));
        res.json({
            success: true,
            totalEpochs: timeline.length,
            epochs: timeline
        });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// App status
apiRouter.get('/status', (req, res) => {
    res.json({
        app: 'ensoria-principles-explorer',
        version: '1.0.0',
        stage: 'production',
        objective: 'OBJ-CORE-APP-003',
        status: 'OPERATING',
        timestamp: new Date().toISOString()
    });
});

// Mount API router
app.use('/api', apiRouter);

// Serve static assets
const publicDir = path.join(__dirname, 'public');
app.use(express.static(publicDir));

// Fallback to index.html for client-side navigation
app.get('*', (req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
});

// If run standalone via CLI
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`[ensoria-principles-explorer] Listening standalone on http://0.0.0.0:${PORT}`);
    });
}

module.exports = app;
