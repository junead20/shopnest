const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Port 587 uses STARTTLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false // Helps with some cloud handshake issues
    },
    family: 4, // Force IPv4 to resolve ENETUNREACH
    connectionTimeout: 10000, 
    greetingTimeout: 5000,    
    socketTimeout: 15000       
  });

  // 2) Define the email options
  const mailOptions = {
    from: `ShopNest <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html
  };

  // 3) Actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
