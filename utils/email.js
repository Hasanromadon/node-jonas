const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  //1) Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD,
    },
    //active in gmail "less secure app" option kalo tes pake gmail
    //gunakan mailtrap untuk tes email
  });
  //2) define the email option
  const mailOptions = {
    from: 'Hasan Romadon <tes@gmail.com>',
    to: options.email,
    text: options.message,
    // html :
  };
  //3)  Actually send the email
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
