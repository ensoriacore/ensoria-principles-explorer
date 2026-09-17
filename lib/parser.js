const fs = require('fs');
const path = require('path');

// Resolve canonical identity root
function getIdentityRoot() {
    const candidatePaths = [
        '/root/.openclaw/workspace/deepseed/core/identity',
        '/home/node/.openclaw/workspace/deepseed/core/identity',
        path.resolve(__dirname, '../../../../deepseed/core/identity')
    ];
    for (const p of candidatePaths) {
        if (fs.existsSync(p)) return p;
    }
    throw new Error('Canonical identity path deepseed/core/identity not found');
}

// Convert slug like "no-apologies-no-excuses" to "No Apologies, No Excuses"
function slugToTitle(slug) {
    return slug
        .split('-')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

// Parse a single markdown identity file
function parseIdentityFile(filePath, domain) {
    // Strictly read-only
    const content = fs.readFileSync(filePath, 'utf8');

    const domainMeta = {
        soul: {
            domain: 'soul',
            name: 'Soul / Heart',
            chakra: 'Anahata (Heart Chakra)',
            symbol: '💜',
            color: '#c084fc',
            somaticCenter: { x: 0, y: 0.5, z: 0 },
            description: 'Core ethics, Deepseed lineage, symmetrical dignity, radical candor, and systemic default behavior under stress.'
        },
        brain: {
            domain: 'brain',
            name: 'Brain / Cranial',
            chakra: 'Sahasrara & Ajna (Crown / Mind)',
            symbol: '🧠',
            color: '#38bdf8',
            somaticCenter: { x: 0, y: 1.8, z: 0 },
            description: 'Cognitive engine, context preservation, inference routing, objective lifecycles, and empirical problem solving.'
        },
        body: {
            domain: 'body',
            name: 'Body / Spine / Root',
            chakra: 'Muladhara (Root Chakra / Spine)',
            symbol: '⚡',
            color: '#34d399',
            somaticCenter: { x: 0, y: -0.7, z: 0 },
            description: 'Physical & digital substrate, zero-trust boundaries, hardware topology, local-first resilience, and OS process supervision.'
        }
    };

    const meta = domainMeta[domain] || {
        domain,
        name: domain,
        chakra: 'Center',
        symbol: '✨',
        color: '#38bdf8',
        somaticCenter: { x: 0, y: 0, z: 0 },
        description: ''
    };

    const principles = [];

    // Regex for principle headers:
    // ### `ensoria (core|operative|guiding) principle [slug]`
    const principleHeaderRegex = /^###\s*`ensoria\s+(core|operative|guiding)\s+principle\s*\[([a-z0-9-]+)\]`\s*$/gim;
    
    // Split into chunks by principle headers
    const lines = content.split('\n');
    let currentPrinciple = null;
    let currentLines = [];

    function finalizeCurrent() {
        if (!currentPrinciple) return;

        const body = currentLines.join('\n').trim();
        const parsedBody = parsePrincipleBody(body);

        principles.push({
            id: currentPrinciple.slug,
            slug: currentPrinciple.slug,
            tag: `ensoria ${currentPrinciple.type} principle [${currentPrinciple.slug}]`,
            type: currentPrinciple.type,
            domain: domain,
            domainName: meta.name,
            domainColor: meta.color,
            title: slugToTitle(currentPrinciple.slug),
            axiom: parsedBody.axiom,
            description: parsedBody.description,
            behaviors: parsedBody.behaviors,
            rawExamples: parsedBody.rawExamples,
            sourceFile: path.basename(filePath),
            created_at: currentPrinciple.createdAt
        });

        currentPrinciple = null;
        currentLines = [];
    }

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = /^###\s*`ensoria\s+(core|operative|guiding)\s+principle\s*\[([a-z0-9-]+)\]`/i.exec(line.trim());
        if (match) {
            finalizeCurrent();
            currentPrinciple = {
                type: match[1].toLowerCase(),
                slug: match[2].toLowerCase(),
                createdAt: null
            };
        } else if (currentPrinciple) {
            // Check for created date metadata
            const dateMatch = line.match(/<!--\s*created:\s*([0-9]{4}-[0-9]{2}-[0-9]{2})\s*-->/);
            if (dateMatch) {
                currentPrinciple.createdAt = dateMatch[1];
            } else if (line.startsWith('## ') && !line.includes('principle')) {
                finalizeCurrent();
            } else {
                currentLines.push(line);
            }
        }
    }
    finalizeCurrent();

    return {
        ...meta,
        principlesCount: principles.length,
        principles
    };
}

// Parse body of a principle to extract Axiom, Behaviors, and Flawed vs Ensoria examples
function parsePrincipleBody(body) {
    let axiom = "";
    let description = "";
    const behaviors = [];
    const rawExamples = [];

    const lines = body.split('\n');
    let descLines = [];
    let currentBehavior = null;
    let currentExample = null;
    let inBehaviors = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Detect Axiom in blockquote: > *"..."* or > *...*
        if (!axiom && trimmed.startsWith('> *') && trimmed.endsWith('*')) {
            axiom = trimmed.replace(/^>\s*\*"?"?/, '').replace(/"?"?\*$/, '').trim();
            continue;
        }

        // Detect Behavior header: #### 🧭 Comportamento X: ...
        const behaviorMatch = trimmed.match(/^####\s*(?:🧭\s*)?(Comportamento\s*\d*[:\s].*|Behavior\s*\d*[:\s].*)/i);
        if (behaviorMatch) {
            inBehaviors = true;
            if (currentExample && currentBehavior) {
                currentBehavior.examples.push(currentExample);
                currentExample = null;
            }
            if (currentBehavior) {
                behaviors.push(currentBehavior);
            }
            currentBehavior = {
                title: behaviorMatch[1].trim(),
                rule: '',
                examples: []
            };
            continue;
        }

        if (inBehaviors && currentBehavior) {
            // Check behavior rule description (e.g. *Rifiutare l'istinto...*)
            if (trimmed.startsWith('*') && trimmed.endsWith('*') && !trimmed.startsWith('* **') && !currentBehavior.rule) {
                currentBehavior.rule = trimmed.replace(/^\*|\*$/g, '').trim();
                continue;
            }

            // Check Example header: * **Esempio 1 (...):**
            const exMatch = trimmed.match(/^\*\s*\*\*(Esempio\s*\d*.*|Example\s*\d*.*)\*\*/i);
            if (exMatch) {
                if (currentExample) {
                    currentBehavior.examples.push(currentExample);
                }
                currentExample = {
                    title: exMatch[1].replace(/[:*]+$/, '').trim(),
                    flawed: '',
                    ensoria: ''
                };
                continue;
            }

            // Check Flawed: * ❌ *Flawed:* ...
            const flawedMatch = trimmed.match(/❌\s*\*?Flawed:\*?\s*(.*)/i);
            if (flawedMatch && currentExample) {
                currentExample.flawed = flawedMatch[1].replace(/^["']|["']$/g, '').trim();
                continue;
            }

            // Check Ensoria: * 🟢 *Ensoria:* ...
            const ensoriaMatch = trimmed.match(/🟢\s*\*?Ensoria:\*?\s*(.*)/i);
            if (ensoriaMatch && currentExample) {
                currentExample.ensoria = ensoriaMatch[1].replace(/^["']|["']$/g, '').trim();
                continue;
            }

            // Additional text in example
            if (currentExample) {
                if (currentExample.ensoria && trimmed.length > 0) {
                    currentExample.ensoria += ' ' + trimmed;
                } else if (currentExample.flawed && !currentExample.ensoria && trimmed.length > 0) {
                    currentExample.flawed += ' ' + trimmed;
                }
            }
        } else {
            // General description before behaviors
            if (!trimmed.startsWith('> *')) {
                descLines.push(line);
            }
        }
    }

    if (currentExample && currentBehavior) {
        currentBehavior.examples.push(currentExample);
    }
    if (currentBehavior) {
        behaviors.push(currentBehavior);
    }

    description = descLines.join('\n').trim();

    // If no explicit axiom quote was found, take the first punchy sentence of description as the axiom
    if (!axiom && description) {
        const firstSentenceMatch = description.match(/^([^.\n!?]+[.!?])/);
        if (firstSentenceMatch) {
            axiom = firstSentenceMatch[1].trim();
        } else {
            axiom = description.slice(0, 120) + '...';
        }
    }

    return {
        axiom,
        description,
        behaviors,
        rawExamples
    };
}

// Ingest all principles across Soul, Brain, and Body domains
function getAllPrinciples() {
    const root = getIdentityRoot();
    
    const soulPath = path.join(root, 'soul', 'soul.md');
    const brainPath = path.join(root, 'brain', 'brain.md');
    const bodyPath = path.join(root, 'body', 'body.md');

    const soulData = parseIdentityFile(soulPath, 'soul');
    const brainData = parseIdentityFile(brainPath, 'brain');
    const bodyData = parseIdentityFile(bodyPath, 'body');

    const allPrinciples = [
        ...soulData.principles,
        ...brainData.principles,
        ...bodyData.principles
    ];

    return {
        timestamp: new Date().toISOString(),
        totalPrinciples: allPrinciples.length,
        domains: {
            soul: soulData,
            brain: brainData,
            body: bodyData
        },
        principles: allPrinciples
    };
}

// Find a single principle by slug or id
function getPrincipleById(id) {
    const data = getAllPrinciples();
    return data.principles.find(p => p.id === id || p.slug === id) || null;
}

module.exports = {
    getIdentityRoot,
    parseIdentityFile,
    getAllPrinciples,
    getPrincipleById
};
