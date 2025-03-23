// Vercel API route for proxying requests to eduvulcan.pl/logowanie
const axios = require('axios');
const formidable = require('formidable');
const FormData = require('form-data');

module.exports = async (req, res) => {
  try {
    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
      handleCors(res);
      return res.status(200).end();
    }

    // Forward cookies if any
    const cookies = req.headers.cookie || '';
    
    // Log request details for debugging
    console.log('Logowanie request method:', req.method);
    console.log('Logowanie content-type:', req.headers['content-type']);
    console.log('Cookies present:', cookies ? 'yes' : 'no');

    if (req.method === 'GET') {
      // Handle GET request - just fetch the login page
      console.log('Making GET request to eduvulcan.pl/logowanie');
      
      const response = await axios.get('https://eduvulcan.pl/logowanie', {
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
      
      // Return the data
      res.status(response.status).send(response.data);
    } else if (req.method === 'POST') {
      // Handle POST request - process login form submission
      
      // Extract form data
      let formData = {};
      const contentType = req.headers['content-type'] || '';
      
      if (contentType.includes('application/json')) {
        // JSON data
        formData = req.body || {};
      } else if (contentType.includes('application/x-www-form-urlencoded')) {
        // URL encoded form
        let body = '';
        await new Promise((resolve) => {
          req.on('data', chunk => {
            body += chunk.toString();
          });
          req.on('end', () => {
            resolve();
          });
        });
        
        const urlParams = new URLSearchParams(body);
        urlParams.forEach((value, key) => {
          formData[key] = value;
        });
      } else {
        // Multipart form data or other content types
        const form = formidable({ multiples: true });
        
        const formResult = await new Promise((resolve, reject) => {
          form.parse(req, (err, fields) => {
            if (err) {
              reject(err);
              return;
            }
            resolve(fields);
          });
        });
        
        formData = formResult;
      }
      
      console.log('Login form data keys:', Object.keys(formData));
      
      // Create URL search params for form submission
      const params = new URLSearchParams();
      Object.entries(formData).forEach(([key, value]) => {
        params.append(key, value.toString());
      });
      
      console.log('Making POST request to eduvulcan.pl/logowanie');
      
      // Forward the POST request
      const response = await axios.post('https://eduvulcan.pl/logowanie', params, {
        headers: {
          cookie: cookies,
          'Content-Type': 'application/x-www-form-urlencoded',
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
      
      // Return the data
      res.status(response.status).send(response.data);
    } else {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }
  } catch (error) {
    console.error('Error proxying to eduvulcan.pl/logowanie:');
    
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
      message: 'Error while contacting eduvulcan.pl',
      details: error.message,
      status: error.response?.status || 500
    });
  }
};

function handleCors(res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
} 