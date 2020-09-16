import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface UserNotificationInstance extends DefaultInstance {
  message: string;
  read: boolean;
}

export default function defineUserNotifications(sequelize: Sequelize) {
  sequelize.define<UserNotificationInstance>(
    "UserNotification",
    {
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
