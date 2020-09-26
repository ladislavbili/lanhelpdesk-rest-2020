import nodemailer from 'nodemailer';
const moment = require('moment');

export async function testSmtp(Smtp) {
  await Smtp.update({
    currentlyTested: true,
    errorMessage: null,
    working: false
  });
  const smtp = Smtp.get();

  let transporter = null;
  if (smtp.wellKnown === null) {
    console.log('other smtp');

    transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure,
      auth: {
        user: smtp.username,
        pass: smtp.password
      },
      tls: {
        rejectUnauthorized: smtp.rejectUnauthorized
      }
    });
  } else {
    console.log('well known', smtp.wellKnown.replace("S_", '').replace(/(?:___)/g, '-').replace(/(?:__)/g, '.'));

    transporter = nodemailer.createTransport({
      service: smtp.wellKnown.replace("S_", '').replace(/(?:___)/g, '-').replace(/(?:__)/g, '.'),
      auth: {
        user: smtp.username,
        pass: smtp.password
      }
    });
  }

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
