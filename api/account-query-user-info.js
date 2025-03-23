// Vercel API route for proxying requests to eduvulcan.pl/Account/QueryUserInfo
const axios = require('axios');
const FormData = require('form-data');

module.exports = async (req, res) => {
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    // Forward cookies if any
    const cookies = req.headers.cookie || '';
    console.log('QueryUserInfo - Content-Type:', req.headers['content-type']);
    
    // Create a simple form data with the email alias
    const formData = new FormData();
    
    // Determine the source of the Alias based on the content type
    let aliasValue = '';
    
    // Try to extract from the request
    if (req.body && req.body.Alias) {
      aliasValue = req.body.Alias;
      console.log('Extracted Alias from req.body:', aliasValue);
    } else if (req.query && req.query.Alias) {
      aliasValue = req.query.Alias;
      console.log('Extracted Alias from query params:', aliasValue);
    } else {
      // Fallback to parse body (only if needed, for url-encoded or raw body)
      console.log('Failed to extract Alias from standard methods, trying fallback');
      
      // Manual body parsing fallback
      try {
        const contentType = req.headers['content-type'] || '';
        
        if (contentType.includes('application/x-www-form-urlencoded')) {
          // Try to manually parse URL-encoded form
          const bodyString = await getRawBody(req);
          const params = new URLSearchParams(bodyString);
          aliasValue = params.get('Alias') || '';
          console.log('Extracted Alias from url-encoded form:', aliasValue);
        }
      } catch (err) {
        console.error('Error in fallback body parsing:', err.message);
      }
    }
    
    if (!aliasValue) {
      console.error('No Alias value found in the request');
      return res.status(400).json({ 
        message: 'Missing Alias field',
        debug: {
          body: req.body,
          contentType: req.headers['content-type'],
          method: req.method
        }
      });
    }
    
    // Add Alias to the form data
    formData.append('Alias', aliasValue);
    
    console.log('Making request to eduvulcan.pl with Alias:', aliasValue);
    
    // Make the API request to eduvulcan
    const response = await axios.post('https://eduvulcan.pl/Account/QueryUserInfo', formData, {
      headers: {
        cookie: cookies,
        ...formData.getHeaders() // Sets the correct Content-Type with boundary
      },
      withCredentials: true
    });
    
    // Forward response cookies
    if (response.headers['set-cookie']) {
      res.setHeader('Set-Cookie', response.headers['set-cookie']);
    }
    
    console.log('QueryUserInfo successful, returning response');
    res.status(response.status).send(response.data);
  } catch (error) {
    console.error('Error in QueryUserInfo proxy:');
    
    if (error.response) {
      console.error(`Response Error: Status ${error.response.status}`);
      console.error('Response Headers:', JSON.stringify(error.response.headers));
      // Limited logging of response data to avoid huge logs
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
      message: 'Failed to contact eduvulcan.pl service',
      error: error.message,
      status: error.response?.status || 500
    });
  }
};

// Helper function to get raw request body
async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk.toString();
    });
    req.on('end', () => {
      resolve(data);
    });
    req.on('error', err => {
      reject(err);
    });
  });
} 