const http = require('http');

const data = JSON.stringify({
    role: "Frontend Developer",
    currentSkills: "HTML, CSS",
    missingSkills: "React"
});

const options = {
    hostname: 'localhost',
    port: 8000,
    path: '/api/projects/generate',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`BODY: ${chunk}`);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
