/**
 * Ensoria Principles Explorer - Test Suite
 * Objective: OBJ-CORE-APP-003
 * Tests all Capabilities and Guardrails in the Ledger.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const http = require('http');
const parser = require('../lib/parser');
const app = require('../server');

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, detail = '') {
    if (condition) {
        console.log(`  \x1b[32m✔ PASS\x1b[0m: ${testName}`);
        passedTests++;
    } else {
        console.error(`  \x1b[31m✖ FAIL\x1b[0m: ${testName} - ${detail}`);
        failedTests++;
    }
}

function getFileHash(filePath) {
    const content = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(content).digest('hex');
}

async function runTestSuite() {
    console.log('\n=============================================================');
    console.log('🧪 Starting Test Suite: Ensoria Principles Explorer');
    console.log('   Objective: OBJ-CORE-APP-003');
    console.log('=============================================================\n');

    // -------------------------------------------------------------
    // Test 1: cap:dynamic-identity-graph-parse
    // -------------------------------------------------------------
    console.log('--- [Capability: cap:dynamic-identity-graph-parse] ---');
    const data = parser.getAllPrinciples();
    assert(data && data.totalPrinciples >= 30, 'Parsed >= 30 total principles', `Got: ${data?.totalPrinciples}`);
    assert(data.domains.soul.principlesCount >= 10, 'Soul domain parsed with >= 10 principles', `Got: ${data.domains.soul.principlesCount}`);
    assert(data.domains.brain.principlesCount >= 10, 'Brain domain parsed with >= 10 principles', `Got: ${data.domains.brain.principlesCount}`);
    assert(data.domains.body.principlesCount >= 6, 'Body domain parsed with >= 6 principles', `Got: ${data.domains.body.principlesCount}`);

    // Check specific high-stakes principles
    const noApologies = parser.getPrincipleById('no-apologies-no-excuses-root-causes-and-solutions-only');
    assert(!!noApologies, 'Extracted no-apologies-no-excuses principle');
    assert(noApologies.axiom.includes('root causes and proposed solutions'), 'Axiom extracted accurately for no-apologies-no-excuses');
    assert(noApologies.behaviors && noApologies.behaviors.length === 3, 'All 3 Comportamenti extracted for no-apologies-no-excuses', `Got: ${noApologies.behaviors?.length}`);

    // Check contrastive examples inside behaviors
    const beh1 = noApologies.behaviors[0];
    assert(beh1 && beh1.examples && beh1.examples.length === 3, 'Behavior 1 contains 3 contrastive examples', `Got: ${beh1?.examples?.length}`);
    const ex1 = beh1?.examples[0];
    assert(ex1 && ex1.flawed && ex1.ensoria, 'Example contains both ❌ Flawed and 🟢 Ensoria entries');
    assert(ex1.flawed.includes('Scusami tanto'), 'Flawed example text parsed accurately');
    assert(ex1.ensoria.includes('Connection Refused'), 'Ensoria example text parsed accurately');

    // Check System Default Behavior
    const sdb = parser.getPrincipleById('system-default-behavior');
    assert(!!sdb, 'Extracted system-default-behavior principle');
    assert(sdb.domain === 'soul', 'system-default-behavior belongs to Soul domain');

    // Check Zero-Trust Boundaries
    const zt = parser.getPrincipleById('zero-trust-physical-boundaries');
    assert(!!zt, 'Extracted zero-trust-physical-boundaries principle');
    assert(zt.domain === 'body', 'zero-trust-physical-boundaries belongs to Body domain');

    // Check Context is King
    const cik = parser.getPrincipleById('context-is-king');
    assert(!!cik, 'Extracted context-is-king principle');
    assert(cik.domain === 'brain', 'context-is-king belongs to Brain domain');

    // -------------------------------------------------------------
    // Test 2: guard:immutable-identity-integrity
    // -------------------------------------------------------------
    console.log('\n--- [Guardrail: guard:immutable-identity-integrity] ---');
    const root = parser.getIdentityRoot();
    const soulPath = path.join(root, 'soul', 'soul.md');
    const brainPath = path.join(root, 'brain', 'brain.md');
    const bodyPath = path.join(root, 'body', 'body.md');

    const soulHashBefore = getFileHash(soulPath);
    const brainHashBefore = getFileHash(brainPath);
    const bodyHashBefore = getFileHash(bodyPath);

    // Re-execute parsing 5 times
    for (let i = 0; i < 5; i++) {
        parser.getAllPrinciples();
    }

    const soulHashAfter = getFileHash(soulPath);
    const brainHashAfter = getFileHash(brainPath);
    const bodyHashAfter = getFileHash(bodyPath);

    assert(soulHashBefore === soulHashAfter, 'Soul identity file remains immutable (SHA-256 matches)');
    assert(brainHashBefore === brainHashAfter, 'Brain identity file remains immutable (SHA-256 matches)');
    assert(bodyHashBefore === bodyHashAfter, 'Body identity file remains immutable (SHA-256 matches)');

    // -------------------------------------------------------------
    // Test 3: cap:chakra-touch-detection
    // -------------------------------------------------------------
    console.log('\n--- [Capability: cap:chakra-touch-detection] ---');
    const centers = [
        { id: 'brain', y: 1.85, chakra: 'Sahasrara & Ajna', color: '#38bdf8' },
        { id: 'soul', y: 0.45, chakra: 'Anahata', color: '#c084fc' },
        { id: 'body', y: -0.75, chakra: 'Muladhara', color: '#34d399' }
    ];
    centers.forEach(c => {
        const domainData = data.domains[c.id];
        assert(!!domainData, `Center '${c.id}' data registered in ecosystem`);
        assert(domainData.color.toLowerCase() === c.color.toLowerCase(), `Center '${c.id}' color corresponds to official token ${c.color}`);
    });

    // -------------------------------------------------------------
    // Test 4: cap:avatar-3d-neon-mesh & Asset Files
    // -------------------------------------------------------------
    console.log('\n--- [Capability: cap:avatar-3d-neon-mesh & Static Assets] ---');
    const pubDir = path.join(__dirname, '../public');
    const indexHtml = fs.readFileSync(path.join(pubDir, 'index.html'), 'utf8');
    const styleCss = fs.readFileSync(path.join(pubDir, 'css/style.css'), 'utf8');
    const avatarJs = fs.readFileSync(path.join(pubDir, 'js/avatar3d.js'), 'utf8');
    const modalJs = fs.readFileSync(path.join(pubDir, 'js/modal.js'), 'utf8');
    const appJs = fs.readFileSync(path.join(pubDir, 'js/app.js'), 'utf8');
    const threeJs = path.join(pubDir, 'vendor/three.min.js');
    const orbitJs = path.join(pubDir, 'vendor/OrbitControls.js');

    assert(fs.existsSync(threeJs) && fs.statSync(threeJs).size > 100000, 'Three.js local bundle verified (>100KB)');
    assert(fs.existsSync(orbitJs) && fs.statSync(orbitJs).size > 10000, 'OrbitControls local bundle verified (>10KB)');
    assert(styleCss.includes('--ensoria-void') && styleCss.includes('--ensoria-cyan') && styleCss.includes('--ensoria-amethyst'), 'CSS defines official Ensoria branding tokens');
    assert(avatarJs.includes('buildEnsoRing') && avatarJs.includes('buildSomaticCenters'), 'Avatar3D implements Ensō Ring and Somatic Centers');
    assert(avatarJs.includes('performRaycast'), 'Avatar3D implements touch/click raycast detection');
    assert(modalJs.includes('ASSIOMA FONDAMENTALE') && modalJs.includes('FLAWED / ANTI-PATTERN'), 'Modal component implements Axiom and contrastive cards');

    // -------------------------------------------------------------
    // Test 5: guard:mobile-responsive-fluidity
    // -------------------------------------------------------------
    console.log('\n--- [Guardrail: guard:mobile-responsive-fluidity] ---');
    assert(indexHtml.includes('user-scalable=no') && indexHtml.includes('viewport-fit=cover'), 'Viewport meta tag contains required mobile constraints');
    assert(styleCss.includes('@media (max-width: 768px)'), 'CSS contains responsive mobile breakpoints');
    assert(avatarJs.includes('touchstart') && avatarJs.includes('touchend'), 'Avatar3D includes mobile touch event handlers');
    assert(avatarJs.includes('Math.min(window.devicePixelRatio || 1, 2)'), 'Avatar3D clamps pixel ratio to 2 for mobile 60fps performance');

    // -------------------------------------------------------------
    // Test 6: API Endpoints (Local Express Server)
    // -------------------------------------------------------------
    console.log('\n--- [Express API & Service Verification] ---');
    const server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    const port = server.address().port;
    const baseUrl = `http://127.0.0.1:${port}`;

    const makeRequest = (urlPath) => new Promise((resolve, reject) => {
        http.get(`${baseUrl}${urlPath}`, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body), headers: res.headers });
                } catch {
                    resolve({ status: res.statusCode, body, headers: res.headers });
                }
            });
        }).on('error', reject);
    });

    const statusRes = await makeRequest('/api/status');
    assert(statusRes.status === 200 && statusRes.data.status === 'OPERATING', 'GET /api/status returns 200 and OPERATING status');

    const centersRes = await makeRequest('/api/centers');
    assert(centersRes.status === 200 && centersRes.data.totalCenters === 3, 'GET /api/centers returns 200 and 3 somatic centers');

    const principlesRes = await makeRequest('/api/principles');
    assert(principlesRes.status === 200 && principlesRes.data.totalPrinciples >= 30, 'GET /api/principles returns 200 and >= 30 principles');

    const singleRes = await makeRequest('/api/principles/no-apologies-no-excuses-root-causes-and-solutions-only');
    assert(singleRes.status === 200 && singleRes.data.principle.slug === 'no-apologies-no-excuses-root-causes-and-solutions-only', 'GET /api/principles/:id returns single principle details');

    const htmlRes = await makeRequest('/');
    assert(htmlRes.status === 200 && htmlRes.body.includes('Ensoria Principles Explorer'), 'GET / serves HTML index');
    assert(htmlRes.body.includes('timeline_slider.js'), 'HTML includes timeline_slider.js');
    assert(htmlRes.body.includes('timeline-container'), 'HTML contains #timeline-container');

    // --- [Timeline Engine (OBJ-CORE-FEAT-002)] ---
    const timelineRes = await makeRequest('/api/timeline');
    assert(timelineRes.status === 200 && timelineRes.data.success === true, 'GET /api/timeline returns 200');
    assert(Array.isArray(timelineRes.data.epochs) && timelineRes.data.totalEpochs >= 3, 'Timeline contains >= 3 historical epochs');

    server.close();

    // -------------------------------------------------------------
    // Test 7: Live Environment End-to-End Routing
    // -------------------------------------------------------------
    console.log('\n--- [Live Environment E2E Routing Verification] ---');
    try {
        const livePath = '/core/ensoria-principles-explorer/';
        const makeLiveRequest = (urlPath) => new Promise((resolve, reject) => {
            http.get(`http://127.0.0.1:3000${urlPath}`, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => resolve({ status: res.statusCode, body }));
            }).on('error', reject);
        });

        const appRes = await makeLiveRequest(livePath);
        assert(appRes.status === 200, 'Live application mounts correctly at /core/ensoria-principles-explorer/');
        assert(appRes.body.includes('timeline-container'), 'Live HTML includes timeline component');
        
        const liveTimelineRes = await makeLiveRequest(`${livePath}api/timeline`);
        assert(liveTimelineRes.status === 200, 'Live API endpoint responds correctly through router mount');
    } catch (err) {
        assert(false, 'Live environment E2E test threw an error', err.message);
    }

    // -------------------------------------------------------------
    // Summary
    // -------------------------------------------------------------
    console.log('\n=============================================================');
    console.log(`📊 Test Summary: ${passedTests} passed, ${failedTests} failed`);
    console.log('=============================================================\n');

    if (failedTests > 0) {
        process.exit(1);
    }
}

runTestSuite().catch(err => {
    console.error('Test suite runner crashed:', err);
    process.exit(1);
});
