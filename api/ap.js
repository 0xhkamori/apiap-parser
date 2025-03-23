// Vercel API route for proxying requests to eduvulcan.pl/api/ap
const axios = require('axios');

module.exports = async (req, res) => {
  try {
    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
      handleCors(res);
      return res.status(200).end();
    }
    
    // Forward cookies if any
    const cookies = req.headers.cookie || '';

    console.log('Request to /api/ap with method:', req.method);
    console.log('Cookies present:', cookies ? 'yes' : 'no');

    // Make the request to eduvulcan.pl
    const response = await axios.get('https://eduvulcan.pl/api/ap', {
      headers: {
        cookie: cookies,
      },
      withCredentials: true,
      maxRedirects: 5,
    });

    // Set CORS headers
    handleCors(res);
    
    // Forward cookies from response
    if (response.headers['set-cookie']) {
      res.setHeader('Set-Cookie', response.headers['set-cookie']);
    }

    // Return the data with same status code
    console.log('Successfully fetched data from eduvulcan.pl/api/ap');
    res.status(response.status).send(response.data);
  } catch (error) {
    console.error('Error proxying to eduvulcan.pl/api/ap:');
    
    // Enhanced error logging
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response headers:', JSON.stringify(error.response.headers));
      console.error('Error response data:', typeof error.response.data === 'string' 
        ? error.response.data.substring(0, 500) 
        : JSON.stringify(error.response.data).substring(0, 500));
    } else if (error.request) {
      console.error('No response received from server');
    } else {
      console.error('Error message:', error.message);
    }
    
    // Send a more informative error back to the client
    res.status(error.response?.status || 500).json({
      message: 'Error while contacting eduvulcan.pl/api/ap',
      details: error.message,
      status: error.response?.status || 500
    });
  }
};

function handleCors(res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
} 