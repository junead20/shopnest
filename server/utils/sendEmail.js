const nodemailer = require('nodemailer');
const dns = require('dns');

const sendEmail = async (options) => {
  // Force IPv4 DNS resolution for smtp.gmail.com
  // Render's default DNS resolves to IPv6 which is unreachable
  const addresses = await dns.promises.resolve4('smtp.gmail.com');
  const gmailIPv4 = addresses[0];

  const transporter = nodemailer.createTransport({
    host: gmailIPv4,
    port: 465,
    secure: true,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      servername: 'smtp.gmail.com', // Required for TLS when connecting by IP
      rejectUnauthorized: true
    },
    connectionTimeout: 10000,
    greetingTimeout: 5000,
    socketTimeout: 15000
  });

  const mailOptions = {
    from: `ShopNest <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
    html: options.html
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
