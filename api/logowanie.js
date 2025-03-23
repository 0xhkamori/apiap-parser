// Vercel API route for proxying requests to eduvulcan.pl/logowanie
const axios = require('axios');

module.exports = async (req, res) => {
  // Set CORS headers for all responses
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Forward cookies if any
    const cookies = req.headers.cookie || '';
    
    console.log('Logowanie request method:', req.method);
    console.log('Logowanie content-type:', req.headers['content-type'] || 'none');
    
    // Handle GET request - Just fetch the login page
    if (req.method === 'GET') {
      console.log('Making GET request to eduvulcan.pl/logowanie');
      
      const response = await axios.get('https://eduvulcan.pl/logowanie', {
        headers: {
          cookie: cookies
        },
        withCredentials: true
      });
      
      // Forward cookies from response
      if (response.headers['set-cookie']) {
        res.setHeader('Set-Cookie', response.headers['set-cookie']);
      }
      
      console.log('GET logowanie successful');
      return res.status(response.status).send(response.data);
    }
    
    // Handle POST request - Process login form
    if (req.method === 'POST') {
      console.log('Processing login POST request');
      
      // Extract form data
      let formData = {};
      
      // Get data from the raw request body
      try {
        const bodyString = await getRawBody(req);
        
        // Check content type to parse body correctly
        const contentType = req.headers['content-type'] || '';
        
        if (contentType.includes('application/json')) {
          // Parse JSON body
          formData = JSON.parse(bodyString);
          console.log('Parsed JSON body with keys:', Object.keys(formData));
        } else if (contentType.includes('application/x-www-form-urlencoded')) {
          // Parse URL-encoded form
          const params = new URLSearchParams(bodyString);
          params.forEach((value, key) => {
            formData[key] = value;
          });
          console.log('Parsed URL-encoded form with keys:', Object.keys(formData));
        } else {
          // For other content types, try to use the body object if available
          formData = req.body || {};
          console.log('Using req.body with keys:', Object.keys(formData));
        }
      } catch (err) {
        console.error('Error parsing request body:', err.message);
        formData = req.body || {};
      }
      
      // Verify we have the necessary login fields
      if (!formData.Alias || !formData.Password) {
        console.error('Missing login credentials in form data');
        return res.status(400).json({ 
          message: 'Missing login credentials',
          debug: {
            keys: Object.keys(formData),
            contentType: req.headers['content-type']
          }
        });
      }
      
      // Create params for the form submission
      const params = new URLSearchParams();
      Object.entries(formData).forEach(([key, value]) => {
        params.append(key, value.toString());
      });
      
      console.log('Making POST request to eduvulcan.pl/logowanie');
      
      // Send login request to eduvulcan
      const response = await axios.post('https://eduvulcan.pl/logowanie', params, {
        headers: {
          cookie: cookies,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        withCredentials: true,
        maxRedirects: 5
      });
      
      // Forward cookies from response
      if (response.headers['set-cookie']) {
        res.setHeader('Set-Cookie', response.headers['set-cookie']);
      }
      
      console.log('POST logowanie successful, status:', response.status);
      return res.status(response.status).send(response.data);
    }
    
    // If not GET or POST
    return res.status(405).json({ message: 'Method Not Allowed' });
  } catch (error) {
    console.error('Error in logowanie proxy:');
    
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
      message: 'Failed to process login request',
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