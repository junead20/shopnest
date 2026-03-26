const axios = require('axios');

const sendEmail = async (options) => {
  // Use the frontend URL as the destination for the API bridge
  // Fallback to the production Vercel URL
  const bridgeUrl = process.env.FRONTEND_URL 
    ? `${process.env.FRONTEND_URL}/api/sendEmail`
    : 'https://shopnest-psi.vercel.app/api/sendEmail';

  try {
    // Pass the email content AND the auth credentials safely via HTTPS POST
    const response = await axios.post(bridgeUrl, {
      to: options.email,
      subject: options.subject,
      html: options.html,
      // Pass the environment variables from Render down to Vercel
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    });

    return response.data;
  } catch (error) {
    console.error('Bridge Email Error:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to send email via Vercel Bridge');
  }
};

module.exports = sendEmail;
