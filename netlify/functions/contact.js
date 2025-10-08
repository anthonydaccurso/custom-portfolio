const validator = require('validator');

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  };

  try {
    const data = JSON.parse(event.body);
    
    // Sanitize inputs
    const name = validator.trim(data.name || '');
    const email = validator.trim(data.email || '');
    const message = validator.trim(data.message || '');

    // Validate name (letters, spaces, hyphens, and apostrophes only)
    if (!name || !validator.matches(name, /^[a-zA-Z\s'-]+$/)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ 
          success: false,
          message: 'Please enter a valid name (letters, spaces, hyphens, and apostrophes only).'
        })
      };
    }

    // Validate email
    if (!email || !validator.isEmail(email)) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Please enter a valid email address.'
        })
      };
    }

    // Validate message length
    if (!message || !validator.isLength(message, { min: 10, max: 1000 })) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          success: false,
          message: 'Message must be between 10 and 1000 characters.'
        })
      };
    }

    // Sanitize all inputs for extra safety
    const sanitizedData = {
      name: validator.escape(name),
      email: validator.normalizeEmail(email),
      message: validator.escape(message)
    };

    // Here you would typically send an email or save to a database
    // For now, we'll just return success
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Thank you for your message! I will get back to you soon.'
      })
    };

  } catch (error) {
    console.error('Contact form error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        message: 'An error occurred while processing your request. Please try again later.'
      })
    };
  }
};