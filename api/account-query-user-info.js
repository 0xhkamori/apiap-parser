// Vercel API route for proxying requests to eduvulcan.pl/Account/QueryUserInfo
const axios = require('axios');

module.exports = async (req, res) => {
  try {
    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
      return handleCors(res);
    }

    if (req.method !== 'POST') {
      return res.status(405).send('Method Not Allowed');
    }

    // Forward cookies if any
    const cookies = req.headers.cookie || '';
    
    // Forward the POST request
    const response = await axios.post('https://eduvulcan.pl/Account/QueryUserInfo', req.body, {
      headers: {
        cookie: cookies,
        'Content-Type': req.headers['content-type'] || 'multipart/form-data',
      },
      withCredentials: true,
    });

    // Set CORS headers and cookies from response
    handleCors(res);
    if (response.headers['set-cookie']) {
      res.setHeader('Set-Cookie', response.headers['set-cookie']);
    }

    // Return the data with same status code
    res.status(response.status).send(response.data);
  } catch (error) {
    console.error('Error proxying to eduvulcan.pl/Account/QueryUserInfo:', error);
    res.status(error.response?.status || 500).send(error.response?.data || 'Internal Server Error');
  }
};

function handleCors(res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (res.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  return false;
} 