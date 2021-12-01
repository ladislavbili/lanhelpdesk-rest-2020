import sanitizeHtml from 'sanitize-html';
import validator from "email-validator";
import { Op } from 'sequelize';
import stripHtml from 'html2plaintext';
import { sendEmail } from '../smtp/sendEmail';
import {
  TaskInstance,
  ProjectInstance,
  StatusInstance,
  TagInstance,
  ProjectAttributesInstance,
} from '@/models/instances';
import { models } from '@/models';
import { randomString, addUser, logWithDate, allNotificationMessages, timestampToString, sendNotification } from '@/helperFunctions';
import moment from 'moment';
import fs from 'fs';


export default async function processEmail(email, Imap) {

  if (email.from.some((from) => !validator.validate(from.address))) {
    logWithDate("invalid e-mail!");
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
  saveEmail(email, Imap);
}

async function addComment(email, Imap, Task, attachmentsData, User, UserId = null) {
  Task.createComment(
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
      UserId,
      CommentAttachments: attachmentsData
    },
    {
      include: [models.CommentAttachment]
    }
  );
  const [assignedTos, requester] = await Promise.all([Task.getAssignedTos(), Task.getRequester()]);
  const notification = allNotificationMessages.comment(
    {
      User,
      taskId: Task.get('id'),
      title: Task.get('title'),
      comment: email.html,
    },
    timestampToString(moment().valueOf())
  );
  if (assignedTos.every((User2) => User2.get('id') !== requester.get('id')) && requester.get('id') !== User.get('id')) {
    sendNotification(User, requester, Task, notification.message, notification.subject, false);
  }
  assignedTos.forEach((assignedTo) => {
    sendNotification(User, assignedTo, Task, notification.message, notification.subject, false);
  });
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
  const timestamp = moment().valueOf();

  if (Task === null) {
    //createTask
    createTask(email, Imap, User, secret);

  } else {
    let completed = 0;
    let attachmentsData = [];
    if (email.attachments.length === 0) {
      addComment(email, Imap, Task, attachmentsData, User, User.get('id'));
    } else {
      email.attachments.forEach((attachment) => {
        fs.promises.mkdir(`files/comment-attachments/${Task.get('id')}`, { recursive: true }).then((eeh) => {
          fs.writeFile(`files/comment-attachments/${Task.get('id')}/${timestamp}-${attachment.filename}`, attachment.content, (eh) => {
            completed++;
            attachmentsData.push({
              filename: attachment.filename,
              mimetype: attachment.contentType,
              size: attachment.size,
              contentDisposition: attachment.contentDisposition === 'inline' ? 'email-content-files' : 'attachments',
              path: `files/comment-attachments/${Task.get('id')}/${timestamp}-${attachment.filename}`,
            });
            if (completed === email.attachments.length) {
              addComment(email, Imap, Task, attachmentsData, User, User.get('id'));
            }
          })
        })
      });
    }
  }
}

async function createTask(email, Imap, User, secret) {
  const now = moment().valueOf();
  const Project = <ProjectInstance>await models.Project.findByPk(Imap.get('ProjectId'), {
    include: [
      {
        model: models.Tag,
        as: 'tags'
      },
      {
        model: models.Status,
        as: 'projectStatuses'
      },
      models.ProjectAttributes,
    ],
  });
  const Statuses = <StatusInstance[]>Project.get('projectStatuses');
  const Tags = <TagInstance[]>Project.get('tags');
  let taskData = <any>{
    title: email.subject,
    important: true,
    closeDate: null,
    deadline: null,
    description: email.html,
    milestone: null,
    //overtime: false,
    //pausal: false,
    pendingChangable: false,
    pendingDate: null,
    //CompanyId: Imap.get('CompanyId'),
    ProjectId: Imap.get('ProjectId'),
    //requesterId: User.get('id'),
    createdById: User.get('id'),
    //StatusId: Status.get('id'),
    //TaskTypeId: TaskType.get('id'),
    statusChange: now,
    TaskMetadata: {
      subtasksApproved: 0,
      subtasksPending: 0,
      tripsApproved: 0,
      tripsPending: 0,
      materialsApproved: 0,
      materialsPending: 0,
      itemsApproved: 0,
      itemsPending: 0,
    },
    TaskChanges: [{
      UserId: User.get('id'),
      TaskChangeMessages: [{
        type: 'task',
        originalValue: null,
        newValue: null,
        message: `Task was created by ${User.get('fullName')}`,
      }]
    }]
  };
  //def attributes
  const defaults = <any>await (<ProjectAttributesInstance>Project.get('ProjectAttribute')).get('attributes');

  (['overtime', 'pausal']).forEach((attribute) => {
    taskData[attribute] = defaults[attribute].value === true;
  });

  (['startsAt', 'deadline']).forEach((attribute) => {
    if (defaults[attribute].value !== null) {
      taskData[attribute] = defaults[attribute].value;
    }
  });

  if (defaults.status.value) {
    taskData.StatusId = defaults.status.value.get('id')
  } else {
    taskData.StatusId = Statuses.find((Status) => Status.get('action') === 'IsNew').get('id')
  }

  if (defaults.requester.value) {
    taskData.requesterId = defaults.requester.value.get('id')
  } else {
    taskData.requesterId = User.get('id')
  }

  if (defaults.company.value) {
    taskData.CompanyId = defaults.company.value.get('id')
  } else {
    taskData.CompanyId = User.get('CompanyId')
  }

  if (defaults.taskType.value) {
    taskData.TaskTypeId = defaults.taskType.value.get('id')
  }

  const NewTask = <TaskInstance>await models.Task.create(
    taskData,
    {
      include: [
        {
          model: models.TaskMetadata,
          as: 'TaskMetadata'
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

  logWithDate(`task created ${NewTask.get('id')} with company ID ${NewTask.get('CompanyId')}`);
  //
  //
  if (defaults.assigned.value.length > 0) {
    await NewTask.setAssignedTos(defaults.assigned.value.map((user) => user.get('id')));
  }
  if (defaults.tags.value.length > 0) {
    await NewTask.setTags(defaults.tags.value.map((tag) => tag.get('id')));
  }

  let completed = 0;
  let attachmentsData = [];
  if (email.attachments.length === 0) {
    addComment(email, Imap, NewTask, attachmentsData, User, User.get('id'));
  } else {
    email.attachments.forEach((attachment) => {
      fs.promises.mkdir(`files/comment-attachments/${NewTask.get('id')}`, { recursive: true }).then((eeh) => {
        fs.writeFile(`files/comment-attachments/${NewTask.get('id')}/${now}-${attachment.filename}`, attachment.content, (eh) => {
          completed++;
          attachmentsData.push({
            filename: attachment.filename,
            mimetype: attachment.contentType,
            size: attachment.size,
            contentDisposition: attachment.contentDisposition === 'inline' ? 'email-content-files' : 'attachments',
            path: `files/comment-attachments/${NewTask.get('id')}/${now}-${attachment.filename}`,
          });
          if (completed === email.attachments.length) {
            addComment(email, Imap, NewTask, attachmentsData, User, User.get('id'));
          }
        })
      })
    });
  }
  const creationNotification = allNotificationMessages.taskRegistrationMessage(
    { title: NewTask.get('title'), taskId: NewTask.get('id'), description: NewTask.get('description') },
    timestampToString(NewTask.get('createdAt').valueOf())
  );
  sendEmail(
    '',
    creationNotification.message,
    `[${NewTask.get('id')}] ${creationNotification.subject}`,
    email.from.map((item) => item.address),
    Imap.get('username')
  );
  const [assignedTos, requester] = await Promise.all([NewTask.getAssignedTos(), NewTask.getRequester()]);
  const taskCreationNotification = allNotificationMessages.creation({
    User,
    taskId: NewTask.get('id'),
    title: NewTask.get('title'),
    createdAt: timestampToString(NewTask.get('createdAt').valueOf()),
    description: NewTask.get('description'),
  });
  if (assignedTos.every((User2) => User2.get('id') !== requester.get('id')) && requester.get('id') !== User.get('id')) {
    sendNotification(User, requester, NewTask, taskCreationNotification.message, taskCreationNotification.subject, false);
  }
  assignedTos.forEach((assignedTo) => {
    sendNotification(User, assignedTo, NewTask, taskCreationNotification.message, taskCreationNotification.subject, false);
  });
}
