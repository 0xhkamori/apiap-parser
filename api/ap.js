// Vercel API route for proxying requests to eduvulcan.pl/api/ap
const axios = require('axios');

module.exports = async (req, res) => {
  try {
    // Forward cookies if any
    const cookies = req.headers.cookie || '';

    // Make the request to eduvulcan.pl
    const response = await axios.get('https://eduvulcan.pl/api/ap', {
      headers: {
        cookie: cookies,
      },
      withCredentials: true,
    });

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    // Return the data with same status code
    res.status(response.status).send(response.data);
  } catch (error) {
    console.error('Error proxying to eduvulcan.pl/api/ap:', error);
    res.status(error.response?.status || 500).send(error.response?.data || 'Internal Server Error');
  }
}; 