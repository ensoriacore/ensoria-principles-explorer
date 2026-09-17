const http = require('http');

console.log('🧪 Starting E2E Live Deployment Verification...');

const makeRequest = (urlPath) => new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:3000${urlPath}`, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', reject);
});

async function runLiveTest() {
    try {
        const livePath = '/core/ensoria-principles-explorer/';
        const appRes = await makeRequest(livePath);
        
        if (appRes.status !== 200) {
            throw new Error(`Live root returned status ${appRes.status}. Supervisor or routing is down.`);
        }
        if (!appRes.body.includes('timeline-container')) {
            throw new Error('Timeline container missing from the live served HTML.');
        }
        
        const timelineRes = await makeRequest(`${livePath}api/timeline`);
        if (timelineRes.status !== 200) {
            throw new Error(`Live API returned status ${timelineRes.status}`);
        }
        
        console.log('  \x1b[32m✔ PASS\x1b[0m: Live service on port 3000 is running, routing correctly, and serving the timeline.');
        process.exit(0);
    } catch (err) {
        console.error(`  \x1b[31m✖ FAIL\x1b[0m: Live environment validation failed - ${err.message}`);
        process.exit(1);
    }
}

runLiveTest();
