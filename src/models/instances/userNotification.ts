import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface UserNotificationInstance extends DefaultInstance {
  subject: string;
  message: string;
  read: boolean;
}

export default function defineUserNotifications(sequelize: Sequelize) {
  sequelize.define<UserNotificationInstance>(
    "UserNotification",
    {
      subject: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ''
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ''
      },
      read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      //OPTIONS
      tableName: 'user_notifications',
      // freezeTableName: true,
    }
  );
}

export function createUserNotificationsAssoc(models) {
  //show user
  models.UserNotification.belongsTo(models.User);
  //created by
  models.UserNotification.belongsTo(models.User, { as: 'createdBy' });
  // Task
  models.UserNotification.belongsTo(models.Task, { foreignKey: { allowNull: false } });
}
