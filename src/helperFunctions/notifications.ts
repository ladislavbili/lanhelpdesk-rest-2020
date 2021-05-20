import { models } from '@/models';
import { sendEmail } from '@/services/smtp';
import { filterUnique } from './index';
import {
  UserNotificationInstance,
  UserInstance,
} from '@/models/instances';
import {
  USER_NOTIFICATION_CHANGE
} from '@/configs/subscriptions';
import { pubsub } from '@/graph/resolvers';
import moment from 'moment';


//from notifications
export const sendTaskNotificationsToUsers = async (FromUser, Task, notifications, taskDeleted = false) => {
  const [response1, response2] = await Promise.all([
    models.User.findAll({ where: { id: [Task.get('requesterId')] } }),
    Task.getAssignedTos()
  ])
  let Users = <UserInstance[]>[...(<UserInstance[]>response1), ...(<UserInstance[]>response2)];
  await Promise.all(
    filterUnique(Users, 'id').map((User) => {
      sendNotification(
        FromUser,
        User,
        Task,
        notifications.reduce((acc, notification) => acc + ` ${notification}
    `, ``),
        `Task was ${taskDeleted ? 'deleted' : 'changed'}`,
        taskDeleted
      );
    })
  )
}

const sendNotification = async (FromUser, User, Task, message, subject, taskDeleted) => {

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
      `In task with id ${Task.get('id')} and current title ${Task.get('title')} was changed at ${moment().format('HH:mm DD.MM.YYYY')}.
      Recorded notifications by ${FromUser === null ? 'system' : (`user ${FromUser.get('fullName')}(${FromUser.get('email')})`)} as follows:
      ${message.length > 0 ? message : 'Non-specified change has happened.'}
      This is an automated message.If you don't wish to receive this kind of notification, please log in and change your profile setting.
      `,
      "",
      `${Task.get('id')}: ${Task.get('title')} was changed at ${moment().format('HH:mm DD.MM.YYYY')} `,
      User.get('email'),
      'LanHelpdesk notification'
    );
  }
}
