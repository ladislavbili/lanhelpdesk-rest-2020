import { models } from '@/models';
import { sendEmail } from '@/services/smtp';
import { filterUnique } from './index';
import {
  UserNotificationInstance,
  UserInstance,
} from '@/models/instances';
import {
  timestampToString,
} from '@/helperFunctions';
import {
  USER_NOTIFICATION_CHANGE
} from '@/configs/subscriptions';
import { pubsub } from '@/graph/resolvers';
import moment from 'moment';


//from notifications
export const sendTaskNotificationsToUsers = async (FromUser, Task, notifications, taskDeleted = false, assignedUsers = [], unassignedUsers = []) => {
  const changeDate = timestampToString(moment().valueOf().toString());
  const taskData = { taskId: Task.get('id'), title: Task.get('title') }
  let [requester, assignedTos] = await Promise.all([
    models.User.findByPk(Task.get('requesterId')),
    Task.getAssignedTos()
  ]);
  //dont send to FromUser, only send requester if not assigned, a bol novy comment alebo sa zmenil status
  if (
    requester &&
    requester.get('id') !== FromUser.get('id') &&
    assignedTos.every((User) => User.get('id') !== requester.get('id'))
  ) {
    const requesterNotification = notifications.find((notification) => (
      notification.type === 'deletion' ||
      notification.type === 'comment' ||
      (notification.type === 'otherAttributes' && notification.data.label === 'Status')
    ));
    if (requesterNotification) {
      const processedRequesterNotification = allNotificationMessages[requesterNotification.type]({ ...requesterNotification.data, ...taskData, User: FromUser }, changeDate, false);
      sendNotification(
        FromUser,
        requester,
        Task,
        `${processedRequesterNotification.messageHeader}<br>${processedRequesterNotification.message}`,
        processedRequesterNotification.subject,
        taskDeleted
      );
    }
  }

  assignedTos = assignedTos.filter((User) => (
    User.get('id') !== FromUser.get('id') &&
    assignedUsers.every((User2) => User2.get('id') !== User.get('id')) &&
    unassignedUsers.every((User2) => User2.get('id') !== User.get('id'))
  ));
  const hasMultiple = assignedTos.length > 1;
  const assignedTosNotifications = notifications.map((notification) => {
    switch (notification.type) {
      case 'title':
      case 'description':
      case 'otherAttributes': {
        return (allNotificationMessages[notification.type]({ ...notification.data, ...taskData, User: FromUser }, changeDate, hasMultiple))
        break;
      }
      case 'otherAttributesAdd': {
        return (allNotificationMessages[notification.type]({ ...notification.data, ...taskData, User: FromUser }, changeDate, hasMultiple))
        break;
      }
      case 'otherAttributesDelete': {
        return (allNotificationMessages[notification.type]({ ...notification.data, ...taskData, User: FromUser }, changeDate))
        break;
      }
      case 'creation': {
        return (allNotificationMessages[notification.type]({ ...notification.data, ...taskData, User: FromUser }))
        break;
      }
      case 'deletion': case 'comment': {
        return (allNotificationMessages[notification.type]({ ...notification.data, ...taskData, User: FromUser }, changeDate))
        break;
      }
      default: {
        return null;
        break;
      }
    }
  }).sort((notification1, notification2) => notification1.order > notification2.order ? -1 : 1);
  assignedTos.forEach((User) => {
    const mainNotification = assignedTosNotifications[0];
    const assignedMessage = `
      ${ mainNotification.messageHeader}<br>
      ${assignedTosNotifications.length > 1 ? 'Ďalšie zmenené attribúty sú ' : ''}${assignedTosNotifications.filter((notification, index) => notification.topMessage && index !== 0).map((notification) => notification.topMessage).join(',')}.<br><br>
      ${ assignedTosNotifications.map((notification) => notification.message).join(`<br><br>`)}
        `;
    sendNotification(
      FromUser,
      User,
      Task,
      assignedMessage,
      mainNotification.subject,
      taskDeleted
    );
  });
  assignedUsers.forEach((User) => {
    const notification = allNotificationMessages.assignedMe({ ...taskData, User: FromUser, description: Task.get('description') }, changeDate);
    const assignedMessage = `
      ${notification.messageHeader}<br>
      ${notification.message}
        `;
    sendNotification(
      FromUser,
      User,
      Task,
      assignedMessage,
      notification.subject,
      taskDeleted
    );
  });
  unassignedUsers.forEach((User) => {
    const notification = allNotificationMessages.unassignedMe({ ...taskData, User: FromUser, description: Task.get('description') }, changeDate);
    const assignedMessage = `
      ${notification.messageHeader}<br>
      ${notification.message}
        `;
    sendNotification(
      FromUser,
      User,
      Task,
      assignedMessage,
      notification.subject,
      taskDeleted
    );
  });
}

export const sendNotification = async (FromUser, User, Task, message, subject, taskDeleted) => {
  await models.UserNotification.create(
    {
      message,
      subject,
      TaskId: taskDeleted ? null : Task.get('id'),
      createdById: FromUser ? FromUser.get('id') : null,
      UserId: User.get('id')
    }
  );
  pubsub.publish(USER_NOTIFICATION_CHANGE, { userNotificationsSubscription: User.get('id') });

  if (User.get('receiveNotifications')) {
    sendEmail(
      ``,
      `${message}<br><br>
      <strong><i>Správa z lanhelpdesk2021.lansystems.sk</strong></i><br>
      <i>This is an automated message. If you don't wish to receive this kind of notification, please log in and change your profile setting.</i>
      `,
      `[${Task.get('id')}]${subject}`,
      User.get('email'),
      'LanHelpdesk notification'
    );
  }
}

const createUserName = (data, html = false) => html ? `<strong>${data.User.get('fullName')}</strong>(<i>${data.User.get('email')}</i>)` : `${data.User.get('fullName')}(${data.User.get('email')})`;
const createTaskTitle = (data, html = false) => html ? `<strong>${data.taskId}: ${data.title}</strong>` : `${data.taskId}: ${data.title}`;

export const allNotificationMessages = {
  title: (data, changeDate, multiple) => ({ //user, task(taskId, title), oldTitle, newTitle
    subject: `V úlohe ${createTaskTitle({ ...data, title: data.oldTitle })} používateľ ${createUserName(data)} zmenil názov úlohy ${multiple ? 'a ďalšie attribúty' : ''} o ${changeDate}`,
    messageHeader: `V úlohe ${createTaskTitle({ ...data, title: data.oldTitle }, true)} používateľ ${createUserName(data, true)} zmenil názov úlohy ${multiple ? 'a ďalšie attribúty' : ''} o ${changeDate}`,
    topMessage: `názov úlohy`,
    order: 0,
    message: `
    <strong>Názov úlohy bol zmenený z</strong><br>
    ${data.oldTitle}<br>
    <strong>na</strong><br>
    ${data.newTitle}
    `,
  }),
  description: (data, changeDate, multiple) => ({ //user, task(taskId, title), oldDescription, newDescription
    subject: `V úlohe ${createTaskTitle(data)} používateľ ${createUserName(data)} zmenil popis úlohy ${multiple ? 'a ďalšie attribúty' : ''} o ${changeDate}`,
    messageHeader: `V úlohe ${createTaskTitle(data, true)} používateľ ${createUserName(data, true)} zmenil popis úlohy ${multiple ? 'a ďalšie attribúty' : ''} o ${changeDate}<br>`,
    topMessage: `popis úlohy`,
    order: 1,
    message: `
      <strong>Popis bol zmenený z</strong><br>
      ${data.oldDescription}<br>
      <strong>na</strong><br>
      ${data.newDescription}<br>
    `,
  }),
  otherAttributes: (data, changeDate, multiple) => ({//user, task(taskId, title), label, old, new
    subject: `V úlohe ${createTaskTitle(data)} používateľ ${createUserName(data)} zmenil ${multiple ? 'viacero attribútov' : data.label} o ${changeDate}`,
    messageHeader: `V úlohe ${createTaskTitle(data, true)} používateľ ${createUserName(data, true)} zmenil ${multiple ? 'viacero attribútov' : data.label} o ${changeDate}<br>`,
    topMessage: `${data.label}`,
    order: 2,
    message: `
      <strong>${data.label} bol zmenený z</strong><br>
      ${data.old}<br>
      <strong>na</strong><br>
      ${data.new}<br>
    `,
  }),
  otherAttributesAdd: (data, changeDate, multiple) => ({//user, task(taskId, title), label, old, new
    subject: `V úlohe ${createTaskTitle(data)} používateľ ${createUserName(data)} pridal ${multiple ? 'viacero attribútov' : data.label} o ${changeDate}`,
    messageHeader: `V úlohe ${createTaskTitle(data, true)} používateľ ${createUserName(data, true)} pridal ${multiple ? 'viacero attribútov' : data.label} o ${changeDate}<br>`,
    topMessage: `pridal ${data.label}`,
    order: 3,
    message: `
      <strong>${data.label} bol vytvorený ako</strong><br>
      ${Object.keys(data.newData).map((key) => `${key}: ${data.newData[key]}`).join(`<br>`)}
    `,
  }),
  otherAttributesDelete: (data, changeDate) => ({//user, task(taskId, title), label, old, new
    subject: `V úlohe ${createTaskTitle(data)} používateľ ${createUserName(data)} odstránil ${data.label} o ${changeDate}`,
    messageHeader: `V úlohe ${createTaskTitle(data, true)} používateľ ${createUserName(data, true)} odstránil ${data.label} o ${changeDate}<br>`,
    topMessage: `zmazal ${data.label}`,
    order: 4,
    message: `
      <strong>${data.label} bol vymazaný. Jeho pôvodné data boli:</strong><br>
      ${Object.keys(data.oldData).map((key) => `${key}: ${data.oldData[key]}`).join(`<br>`)}
    `,
  }),

  creation: (data) => ({//user, task(taskId, title),description - all users
    subject: `Používateľ ${createUserName(data)} Vám priradil úlohu ${createTaskTitle(data)} o ${data.createdAt}`,
    messageHeader: `Používateľ ${createUserName(data, true)} Vám priradil úlohu ${createTaskTitle(data, true)} o ${data.createdAt}<br>`,
    message: `
      <strong>Popis úlohy</strong><br>
      ${data.description}
    `,
    order: -1,
  }),
  deletion: (data, changeDate) => ({//user, task(taskId, title),description - all users
    subject: `Používateľ ${createUserName(data)} odstránil úlohu ${createTaskTitle(data)} o ${changeDate}`,
    messageHeader: `Používateľ ${createUserName(data, true)} odstránil úlohu ${createTaskTitle(data, true)} o ${changeDate}<br>`,
    message: `
      <strong>Popis úlohy</strong><br>
      ${data.description}
    `,
    order: -1,
  }),
  assignedMe: (data, changeDate) => ({//user, task(taskId, title), description
    subject: `Používateľ ${createUserName(data)} Vám priradil úlohu ${createTaskTitle(data)} o ${changeDate}`,
    messageHeader: `Používateľ ${createUserName(data, true)} Vám priradil úlohu ${createTaskTitle(data, true)} o ${changeDate}<br>`,
    message: `
      <strong>Popis úlohy</strong><br>
      ${data.description}
    `,
    order: -1,
  }),
  unassignedMe: (data, changeDate) => ({//user, task(taskId, title), description
    subject: `Používateľ ${createUserName(data)} Vám odobral úlohu ${createTaskTitle(data)} o ${changeDate}`,
    messageHeader: `Používateľ ${createUserName(data, true)} Vám odobral úlohu ${createTaskTitle(data, true)} o ${changeDate}<br>`,
    message: `
      <strong>Popis úlohy</strong><br>
      ${data.description}
    `,
    order: -1,
  }),
  comment: (data, changeDate) => ({//user, task(taskId, title), comment
    subject: `Používateľ ${createUserName(data)} pridal komentár k úlohe ${createTaskTitle(data)} o ${changeDate}`,
    messageHeader: `Používateľ ${createUserName(data, true)} pridal komentár k úlohe ${createTaskTitle(data, true)} o ${changeDate}<br>`,
    message: `
      <strong>Komentár</strong><br>
      ${data.comment}
    `,
    order: -1,
  }),
  taskRegistrationMessage: (data, changeDate) => ({//task(taskId, title), description
    subject: `Helpdesk  lanhelpdesk2021.lansystems.sk zaregistroval Váš mail ako úlohu  ${createTaskTitle(data)} o ${changeDate}`,
    messageHeader: '',
    message: `
    Helpdesk  <strong>lanhelpdesk2021.lansystems.sk</strong> zaregistroval Váš mail ako úlohu  ${createTaskTitle(data, true)} o ${changeDate}<br>
    Odpoveďou na tento e-mail nás viete priamo kontaktovať. Prosím ponechajte číslo tiketu v hlavičke správy.<br><br>
      <strong>Popis úlohy:</strong><br>
      ${data.description}<br><br>
      <strong><i>Správa z lanhelpdesk2021.lansystems.sk</strong></i><br>
      <i>This is an automated message. If you don't wish to receive this kind of notification, please log in and change your profile setting.</i>
    `,
    order: -1,
  }),
}
