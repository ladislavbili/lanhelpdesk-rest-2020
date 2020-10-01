import sanitizeHtml from 'sanitize-html';
import validator from "email-validator";
import { Op } from 'sequelize';
import stripHtml from 'html2plaintext';
import { JSDOM } from "jsdom";
import { Duplex } from 'stream';
import { sendEmail } from '../smtp/sendEmail';
import { TaskInstance, ProjectInstance } from '@/models/instances';
import { models } from '@/models';
import { addUser } from '@/configs/addData';
import { randomString } from '@/helperFunctions';
import moment from 'moment';


export default async function processEmail(email, Imap) {

  if (email.from.some((from) => !validator.validate(from.address))) {
    console.log("invalid e-mail!");
    sendEmail('Your message has not been delivered as your e-mail address was rejected. \n In case you feel like you are not breaking any rules please contact administrator.', '', 'Your message hasn\'t been delivered', email.from.map((item) => item.address), 'test@lanhelpdesk.com');
    return;
  }
  email.originalText = email.text.includes('\n> ##**//Add your response above. \\\\**##\n>\n') ?
    email.text.substring(0, email.text.indexOf('\n> ##**//Add your response above. \\\\**##\n>\n')) :
    email.text;
  email.originalHTML = email.html && email.html.includes('<span style="color:rgb(245,245,240)">##**//Add your response above. \\\\**##</span><br>') ?
    email.html.substring(0, email.html.indexOf('<span style="color:rgb(245,245,240)">##**//Add your response above. \\\\**##</span><br>')) :
    email.html;
  email.originalHTML = email.originalHTML && email.originalHTML.lastIndexOf('<blockquote') !== -1 ? email.originalHTML.substring(0, email.originalHTML.lastIndexOf('<blockquote')) : email.originalHTML;

  email.html = email.originalHTML ? sanitizeHtml(email.originalHTML) : null;
  email.text = email.html ? stripHtml(email.html) : email.text;
  //If you want to save e-mail images too
  /*
  let images=[];
  if(mail.originalHTML){
    const dom = new JSDOM(mail.originalHTML);
    let htmlImages = dom.window.document.getElementsByTagName("img");
    for (let img of htmlImages) {
      images.push({src:img.src,alt:img.alt, width:img.width, height:img.height})
    }
  }
  mail.images = images;
  */
  /*
  files handle here
  */
  saveEmail(email, Imap);
}

function bufferToStream(buffer) {
  let stream = new Duplex();
  stream.push(buffer);
  stream.push(null);
  return stream;
}

function uploadMailPart(attachment) {
  let folder = attachment.contentDisposition === 'inline' ? 'email-content-files' : 'email-attachments';
}

async function saveEmail(email, Imap) {
  let secret = { newUser: false, password: '' };
  let User = null;
  const Users = await models.User.findAll({
    where: {
      email: {
        [Op.or]: email.from.map((item) => item.address)
      }
    }
  });

  if (Users.length === 0) {
    const emailFirstSender = email.from[0];
    const fullName = email.from[0].name.split(' ');
    secret = { newUser: true, password: `${randomString()}#${randomString()}` };
    User = await addUser({
      active: true,
      username: emailFirstSender.name,
      email: emailFirstSender.address,
      name: fullName[0] || 'none',
      surname: fullName[1] || 'none',
      password: secret.password,
      receiveNotifications: true,
      signature: 'Nic',
      roleId: Imap.get('RoleId'),
      companyId: Imap.get('CompanyId'),
      language: 'sk'
    })
  } else {
    User = Users[0];
  }

  //has an ID in subject
  const taskId = parseInt(email.subject.substring(email.subject.indexOf('[') + 1, email.subject.indexOf(']')));
  let Task = null;
  if (!isNaN(taskId)) {
    Task = await models.Task.findByPk(taskId);
  }

  if (Task === null) {
    //createTask
    createTask(email, Imap, User, secret);

  } else {

    Task.addComment(
      {
        message: email.text,
        rawMessage: email.originalText,
        html: email.html,
        rawHtml: email.originalHTML,
        internal: false,
        subject: email.subject,
        isEmail: true,
        emailSend: true,
        emailError: null,
        isParent: true,
        EmailTargets: [{ address: Imap.get('username') }],
      },
      {
        include: [{ model: models.EmailTarget }]
      }
    )
    console.log('done adding comment');
  }

}

async function createTask(email, Imap, User, secret) {
  console.log('create task');

  const Status = await models.Status.findOne({ where: { action: 'IsNew' } });
  const TaskType = await models.TaskType.findOne();
  const now = moment().valueOf();
  let taskData = {
    title: email.subject,
    important: true,
    closeDate: null,
    deadline: null,
    description: email.text,
    milestone: null,
    overtime: false,
    pausal: false,
    pendingChangable: false,
    pendingDate: null,
    CompanyId: Imap.get('CompanyId'),
    ProjectId: Imap.get('ProjectId'),
    requesterId: User.get('id'),
    createdById: User.get('id'),
    StatusId: Status.get('id'),
    TaskTypeId: TaskType.get('id'),
    statusChange: now,

    TaskChanges: [{
      UserId: User.get('id'),
      TaskChangeMessages: [{
        type: 'task',
        originalValue: null,
        newValue: null,
        message: `Task was created by ${User.get('fullName')}`,
      }]
    }],
    Comments: [{
      message: email.text,
      rawMessage: email.originalText,
      html: email.html,
      rawHtml: email.originalHTML,
      internal: false,
      subject: email.subject,
      isEmail: true,
      emailSend: true,
      emailError: null,
      isParent: true,
      EmailTargets: [{ address: Imap.get('username') }],
    }],
  };

  const defaults = <any>await (<ProjectInstance>await models.Project.findByPk(Imap.get('ProjectId'))).get('def');

  (['overtime', 'pausal']).forEach((attribute) => {
    if (defaults[attribute].def) {
      taskData[attribute] = defaults[attribute].value;
    }
  });

  (['company', 'requester', 'status', 'taskType']).forEach((attribute) => {
    if (defaults[attribute].def) {
      taskData[attribute] = defaults[attribute].value.get('id');
    }
  });

  const NewTask = <TaskInstance>await models.Task.create(
    taskData,
    {
      include: [
        {
          model: models.Comment,
          include: [
            { model: models.EmailTarget }
          ]
        },
        {
          model: models.TaskChange,
          include: [
            { model: models.TaskChangeMessage }
          ]
        }
      ]
    }
  );
  console.log(`task created with company ID ${NewTask.get('CompanyId')}`);
  if (defaults.assignedTo.def) {
    NewTask.setAssignedTos(defaults.assignedTo.value.map((value) => value.get('id')));
  }
  if (defaults.tag.def) {
    NewTask.setTags(defaults.tag.value.map((value) => value.get('id')));
  }

  sendEmail(
    `Dobrý deň, \n
      Radi by sme Vám oznámili, že Vaša žiadosť bola zaevidovaná pod číslom tiketu: ${NewTask.get('id')} ${email.subject}.
      Odpoveďou na tento e-mail nás viete priamo kontaktovať. Prosím ponechajte číslo tiketu v hlavičke správy.
      Stav tiketu: https://test2020.lanhelpdesk.com/helpdesk/taskList/i/all/${NewTask.get('id')}` + (!secret.newUser ? '' : `
      Za účelom sledovania stavu tiketu sme Vám vytvorili účet s obmedzeným prístupom, heslo si prosím po prihlásení nezabudnite zmeniť! \n
      E-mail: ${User.get('email')} \n
      Heslo: ${secret.password}\n`),
    '',
    `[${NewTask.get('id')}] Vaša požiadavka s ID ${NewTask.get('id')} bola prijatá.`,
    email.from.map((item) => item.address),
    'test@lanhelpdesk.com'
  );
}
