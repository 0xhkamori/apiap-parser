// Vercel API route for proxying requests to eduvulcan.pl/api/ap
const axios = require('axios');

module.exports = async (req, res) => {
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Forward cookies if any
    const cookies = req.headers.cookie || '';

    console.log('AP API request received');
    console.log('Cookies present:', cookies ? 'yes' : 'no');

    // Make the API request to eduvulcan
    const response = await axios.get('https://eduvulcan.pl/api/ap', {
      headers: {
        cookie: cookies,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
      },
      withCredentials: true
    });
    
    // Forward cookies from response
    if (response.headers['set-cookie']) {
      res.setHeader('Set-Cookie', response.headers['set-cookie']);
    }
    
    console.log('AP API request successful');
    return res.status(response.status).send(response.data);
  } catch (error) {
    console.error('Error in AP API proxy:');
    
    if (error.response) {
      console.error(`Response Error: Status ${error.response.status}`);
      console.error('Response Headers:', JSON.stringify(error.response.headers));
      if (typeof error.response.data === 'string') {
        console.error('Response Data (first 200 chars):', error.response.data.substring(0, 200));
      } else {
        console.error('Response Data:', JSON.stringify(error.response.data).substring(0, 200));
      }
    } else if (error.request) {
      console.error('No response received from eduvulcan.pl');
    } else {
      console.error('Error message:', error.message);
    }
    
    return res.status(500).json({
      message: 'Failed to fetch data from eduvulcan.pl/api/ap',
      error: error.message,
      status: error.response?.status || 500
    });
  }
}; 