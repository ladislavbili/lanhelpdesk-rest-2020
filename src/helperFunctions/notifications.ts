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
      (notification.type === 'otherAttributes' && notification.data.label === 'Status') ||
      notification.type === 'creation' ||
      notification.type === 'assignedAsRequester'
    ));
    if (requesterNotification) {
      const processedRequesterNotification = allNotificationMessages[requesterNotification.type !== 'creation' ? requesterNotification.type : 'createdForMe']({ ...requesterNotification.data, ...taskData, User: FromUser }, false);
      if (processedRequesterNotification === undefined) {
        console.log(`Error found, created by ${requesterNotification.type}, ${requesterNotification.data ? requesterNotification.data.label : 'empty'}`);
        return;
      }
      sendNotification(
        FromUser,
        requester,
        Task,
        `
        ${processedRequesterNotification.messageHeader}<br>
        ${createNotificationTaskTitle(taskData, true)}<br>
        Vykonal: ${createNotificationUserName({ User: FromUser }, true)}<br>
        Čas: ${changeDate}<br><br>
        ${processedRequesterNotification.message}`,
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
  const hasMultiple = notifications.length > 1;
  const assignedTosNotifications = notifications.filter((notification) => !['assignedAsRequester'].includes(notification.type)).map((notification) => {
    switch (notification.type) {
      case 'title':
      case 'description':
      case 'otherAttributes': {
        return (allNotificationMessages[notification.type]({ ...notification.data, ...taskData, User: FromUser }, hasMultiple))
        break;
      }
      case 'otherAttributesAdd': {
        return (allNotificationMessages[notification.type]({ ...notification.data, ...taskData, User: FromUser }, hasMultiple))
        break;
      }
      case 'otherAttributesDelete': {
        return (allNotificationMessages[notification.type]({ ...notification.data, ...taskData, User: FromUser }))
        break;
      }
      case 'creation': {
        return (allNotificationMessages[notification.type]({ ...notification.data, ...taskData, User: FromUser }))
        break;
      }
      case 'deletion': case 'comment': {
        return (allNotificationMessages[notification.type]({ ...notification.data, ...taskData, User: FromUser }))
        break;
      }
      default: {
        return null;
        break;
      }
    }
  }).sort((notification1, notification2) => notification1.order < notification2.order ? -1 : 1);
  if (assignedTosNotifications.length > 0) {
    assignedTos.forEach((User) => {
      const mainNotification = assignedTosNotifications[0];
      console.log(notifications);
      console.log(mainNotification);

      const assignedMessage = `
      ${ mainNotification.messageHeader} <br>
      ${
        assignedTosNotifications.length > 1 ?
          `${assignedTosNotifications.map((notification) => notification.topMessage).join(', ')} v úlohe:<br>` :
          ``
        }
      ${ createNotificationTaskTitle(taskData, true)} <br>
      Vykonal: ${ createNotificationUserName({ User: FromUser }, true)} <br>
      Čas: ${ changeDate} <br><br>
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
  }
  assignedUsers.filter((User) => User.get('id') !== FromUser.get('id')).forEach((User) => {
    const notification = allNotificationMessages.assignedMe({ ...taskData, User: FromUser, description: Task.get('description') });
    const assignedMessage = `
  ${ notification.messageHeader} <br>
    ${ createNotificationTaskTitle(taskData, true)} <br>
      Vykonal: ${ createNotificationUserName({ User: FromUser }, true)} <br>
        Čas: ${ changeDate} <br><br>
          ${ notification.message}
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
  unassignedUsers.filter((User) => User.get('id') !== FromUser.get('id')).forEach((User) => {
    const notification = allNotificationMessages.unassignedMe({ ...taskData, User: FromUser, description: Task.get('description') });
    const assignedMessage = `
  ${ notification.messageHeader} <br>
    ${ createNotificationTaskTitle(taskData, true)} <br>
      Vykonal: ${ createNotificationUserName({ User: FromUser }, true)} <br>
        Čas: ${ changeDate} <br><br>
          ${ notification.message}
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
/*<br>
${createNotificationTaskTitle(taskData, true)}<br>
Vykonal: ${createNotificationUserName({ User: FromUser }, true)}<br>
Čas: ${changeDate}<br><br>
*/

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
      `${message} <br><br>
    <strong><i>Správa z lanhelpdesk2021.lansystems.sk < /strong></i > <br>
      <i>This is an automated message.If you don't wish to receive this kind of notification, please log in and change your profile setting.</i>
        `,
      `[${Task.get('id')}]${subject} `,
      User.get('email'),
      'LanHelpdesk notification'
    );
  }
}

export const createNotificationUserName = (data, html = false) => html ? `< strong > ${data.User.get('fullName')} </strong>(<i>${data.User.get('email')}</i >)` : `${data.User.get('fullName')} (${data.User.get('email')})`;
export const createNotificationTaskTitle = (data, html = false) => html ? `< strong > ${data.taskId}: ${data.title} </strong>` : `${data.taskId}: ${data.title}`;

export const allNotificationMessages = {
  title: (data, multiple) => ({ //user, task(taskId, title), oldTitle, newTitle
    subject: `Úloha ${createNotificationTaskTitle({ ...data, title: data.oldTitle })} bola premenovaná`,
    messageHeader: `Úloha bola premenovaná${multiple ? ' a viacero polí zmenených. Medzi ne patria' : ""}:`,
    topMessage: `názov úlohy`,
    order: 0,
    message: `
    <strong>Názov úlohy bol zmenený z</strong><br>
    ${data.oldTitle}<br>
    <strong>na</strong><br>
    ${data.newTitle}
    `,
  }),
  description: (data, multiple) => ({ //user, task(taskId, title), oldDescription, newDescription
    subject: `Zmena Popisu v úlohe ${createNotificationTaskTitle(data)}`,
    messageHeader: `Zmena Popisu ${multiple ? 'a viacero polí. Medzi ne patria:' : "v úlohe"}:`,
    topMessage: `popis úlohy`,
    order: 1,
    message: `
      <strong>Popis bol zmenený z</strong><br>
      ${data.oldDescription}<br>
      <strong>na</strong><br>
      ${data.newDescription}<br>
    `,
  }),
  otherAttributes: (data, multiple) => ({//user, task(taskId, title), label, old, new
    subject: `Zmena ${multiple ? 'viacero polí' : data.label} v úlohe ${createNotificationTaskTitle(data)}`,
    messageHeader: `Zmena ${multiple ? 'viacerých polí. Medzi ne paria:' : `${data.label} v úlohe:`}`,
    topMessage: `${data.label}`,
    order: 2,
    message: `
      ${ multiple ? `<strong>${data.label} bol zmenený z</strong><br>` : ''}
      ${(typeof data.old === "boolean" || data.old) ? (data.old === "boolean" ? (data.old ? 'Áno' : 'Nie') : data.old) : 'Bez hodnoty'}<br>
      <strong>na</strong><br>
      ${(typeof data.new === "boolean" || data.new) ? (data.new === "boolean" ? (data.new ? 'Áno' : 'Nie') : data.new) : 'Bez hodnoty'}
    `,
  }),
  otherAttributesAdd: (data) => ({//user, task(taskId, title), label, old, new
    subject: `Pridanie ${data.label} v úlohe ${createNotificationTaskTitle(data)}`,
    messageHeader: `Pridanie ${data.label} v úlohe:`,
    topMessage: `pridal ${data.label}`,
    order: 3,
    message: `
      ${data.newData.join(` - `)}
    `,
  }),
  otherAttributesDelete: (data) => ({//user, task(taskId, title), label, old, new
    subject: `Odstránenie ${data.label} v úlohe ${createNotificationTaskTitle(data)}`,
    messageHeader: `Odstránenie ${data.label} v úlohe:`,
    topMessage: `zmazal ${data.label}`,
    order: 4,
    message: `
      ${data.oldData.join(` - `)}
    `,
  }),

  creation: (data) => ({//user, task(taskId, title),description - all users
    subject: `Bola vytvorená a Vám priradená úloha ${createNotificationTaskTitle(data)}`,
    messageHeader: `Bola vytvorená a Vám priradená úloha:`,
    message: `
      <strong>Popis úlohy</strong><br>
      ${data.description}
    `,
    order: -1,
  }),
  deletion: (data) => ({//user, task(taskId, title),description - all users
    subject: `Úloha bola vymazaná ${createNotificationTaskTitle(data)}`,
    messageHeader: `Úloha bola vymazaná:`,
    message: `
    <strong>Popis úlohy</strong><br>
    ${data.description}
    `,
    order: -1,
  }),
  createdForMe: (data) => ({//user, task(taskId, title), description
    subject: `Používateľ ${createNotificationUserName(data)} zaregistroval Vašu požiadavku: ${createNotificationTaskTitle(data)}`,
    messageHeader: `Používateľ ${createNotificationUserName(data, true)} zaregistroval Vašu požiadavku:`,
    message: `
      ${data.description}
    `,
    order: -1,
  }),
  assignedAsRequester: (data) => ({//user, task(taskId, title), description
    subject: `Používateľ ${createNotificationUserName(data)} zaregistroval Vašu požiadavku: ${createNotificationTaskTitle(data)}`,
    messageHeader: `Používateľ ${createNotificationUserName(data, true)} zaregistroval Vašu požiadavku:`,
    message: `
      ${data.description}
    `,
    order: -1,
  }),
  assignedMe: (data) => ({//user, task(taskId, title), description
    subject: `Bola Vám priradená úloha ${createNotificationTaskTitle(data)}`,
    messageHeader: `Bola Vám priradená úloha:`,
    message: `
      <strong>Popis úlohy</strong><br>
      ${data.description}
    `,
    order: -1,
  }),
  unassignedMe: (data) => ({//user, task(taskId, title), description
    subject: `Bola Vám odobraná úloha ${createNotificationTaskTitle(data)}`,
    messageHeader: `Bola Vám odobraná úloha:`,
    message: `
      <strong>Popis úlohy</strong><br>
      ${data.description}
    `,
    order: -1,
  }),
  comment: (data) => ({//user, task(taskId, title, internal), comment
    subject: `Nový ${data.internal ? 'interný' : ''} komentár v úlohe ${createNotificationTaskTitle(data)}`,
    messageHeader: `Používateľ ${createNotificationUserName(data, true)} pridal komentár k úlohe:`,
    message: `
    ${data.comment}
    `,
    order: -1,
  }),
  taskRegistrationMessage: (data, changeDate) => ({//task(taskId, title, description), description
    subject: `Úloha bola zaregistrovaná: ${createNotificationTaskTitle(data)}`,
    messageHeader: '',
    message: `
    Vaša požiadavka bola zaregistrovaná:<br>
    ${createNotificationTaskTitle(data, true)}<br>
    Čas: ${changeDate}<br>
    Odpoveďou na tento e-mail nás viete priamo kontaktovať. Prosím ponechajte číslo tiketu v hlavičke správy.<br><br>
    ${data.description}
    `,
    order: -1,
  }),
}

//TODO interny komentar nevidi kazdy
