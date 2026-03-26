const nodemailer = require('nodemailer');

module.exports = async (req, res) => {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Set CORS headers so the Render backend can call this API
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { to, subject, html, user, pass } = req.body;

  if (!to || !subject || !html || !user || !pass) {
    return res.status(400).json({ message: 'Missing required email fields or credentials' });
  }

  // Create standard SMTP transporter (Vercel allows Port 465)
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: user,
      pass: pass
    },
    // Essential for Vercel serverless environments
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 15000
  });

  try {
    // Attempt to send the email
    const info = await transporter.sendMail({
      from: `ShopNest <${user}>`,
      to: to,
      subject: subject,
      html: html
    });
    
    console.log('✅ Email sent successfully via Vercel Bridge. Message ID:', info.messageId);
    
    return res.status(200).json({ 
      success: true, 
      message: 'Email sent successfully', 
      messageId: info.messageId 
    });
  } catch (error) {
    console.error('❌ Vercel Bridge SMTP Error:', error.message);
    
    return res.status(500).json({ 
      success: false, 
      message: 'Failed to send email via Vercel Bridge', 
      error: error.message,
      code: error.code
    });
  }
}
