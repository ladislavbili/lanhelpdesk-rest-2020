import nodemailer from 'nodemailer';
import { addError } from '@/helperFunctions';
import moment from 'moment';
import { models } from '@/models';

export function sendEmail(textMessage, htmlMessage, subject, to, from, files = []) {
  return new Promise(async (resolve, reject) => {
    const Smtp = await models.Smtp.findOne({ where: { def: true } });
    if (Smtp === null) {
      addError("Send Email", "No default SMTP!", 'smtp_email', Smtp.get('id'));
      resolve({ error: true, message: "No default SMTP!" });
    }
    const smtp = Smtp.get();

    let transporter = null;
    if (smtp.wellKnown === null) {
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
        console.log('smtp not working (send mail)');
        addError("Default SMTP not connectable or authorized!", error.message, 'smtp_email', smtp.id);
        resolve({ error: true, message: "Default SMTP not connectable or authorized!" });
      }
      const mailOptions = {
        to: to.toString(),
        subject: subject,
        text: textMessage,
        from: smtp.username,
        html: htmlMessage,
        attachments: (files ? files : []).map((file) => {
          return {
            filename: file.name,
            content: file.data,
            contentType: file.mimetype,
            contentDisposition: 'attachment',
            encoding: file.encoding,
          }
        })
      };

      transporter.sendMail(mailOptions, function(error, info) {
        if (error) {
          console.log('send email', error);
          addError("Failed to send the e-mail!", error.message, 'smtp_email', smtp.id);
          resolve({ error: true, message: "Failed to send the e-mail!" });
        } else {
          resolve({ error: false, message: `Email sent: ${info.response}` });
        }
      });
    });

  })
}
