import nodemailer from 'nodemailer';
const moment = require('moment');

export default async function testSmtp(Smtp) {
  await Smtp.update({
    currentlyTested: true,
    errorMessage: null,
    working: false
  });
  const smtp = Smtp.get();
  let transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: {
      user: smtp.user,
      pass: smtp.pass
    },
    tls: {
      rejectUnauthorized: smtp.rejectUnauthorized
    }
  });

  transporter.verify(function(error, success) {
    if (error) {
      Smtp.update({
        currentlyTested: false,
        errorMessage: error.message,
        working: false
      });
    } else {
      Smtp.update({
        currentlyTested: false,
        working: true
      });
    }
  })
}
