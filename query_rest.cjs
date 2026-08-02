const https = require('https');

const projectId = 'ai-studio-jurnalmengajargu-429b906f-b4d8-43d2-bd51-5cc768b29c81';
const options = {
  hostname: 'firestore.googleapis.com',
  port: 443,
  path: `/v1/projects/${projectId}/databases/(default)/documents/sociometries`,
  method: 'GET'
};

const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => { data += chunk; });
  res.on('end', () => { console.log(data); });
});

req.on('error', error => { console.error(error); });
req.end();
