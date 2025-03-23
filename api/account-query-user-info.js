// Vercel API route for proxying requests to eduvulcan.pl/Account/QueryUserInfo
const axios = require('axios');
const formidable = require('formidable');
const FormData = require('form-data');
const fs = require('fs');

module.exports = async (req, res) => {
  try {
    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
      handleCors(res);
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return res.status(405).json({ message: 'Method Not Allowed' });
    }

    // Forward cookies if any
    const cookies = req.headers.cookie || '';
    
    console.log('QueryUserInfo - Content-Type:', req.headers['content-type']);
    
    // Parse the form data
    let aliasValue = null;
    
    // Check content type
    const contentType = req.headers['content-type'] || '';
    
    if (contentType.includes('application/json')) {
      // JSON data
      aliasValue = req.body?.Alias || null;
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
      aliasValue = urlParams.get('Alias');
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
      
      aliasValue = formResult.Alias || null;
    }
    
    if (!aliasValue) {
      return res.status(400).json({ message: 'Missing Alias field' });
    }
    
    console.log('Alias value:', aliasValue);
    
    // Create a new form data
    const formData = new FormData();
    formData.append('Alias', aliasValue);
    
    console.log('Making POST request to QueryUserInfo with Alias:', aliasValue);
    
    // Make the request with the form data
    const response = await axios.post('https://eduvulcan.pl/Account/QueryUserInfo', formData, {
      headers: {
        cookie: cookies,
        ...formData.getHeaders()
      },
      withCredentials: true,
      maxRedirects: 5
    });
    
    // Set CORS headers
    handleCors(res);
    
    // Forward cookies from response
    if (response.headers['set-cookie']) {
      res.setHeader('Set-Cookie', response.headers['set-cookie']);
    }
    
    // Return the data with same status code
    res.status(response.status).send(response.data);
  } catch (error) {
    console.error('Error proxying to eduvulcan.pl/Account/QueryUserInfo:');
    
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
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
} 