import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface TaskChangeMessageInstance extends DefaultInstance {
  type: string;
  originalValue: string;
  newValue: string;
  message: string;
}

export default function defineTaskChangeMessages( sequelize: Sequelize ){
  sequelize.define<TaskChangeMessageInstance>(
    "TaskChangeMessage",
    {
      type: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      originalValue: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      newValue: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      }
    },
    {
      //OPTIONS
      tableName: 'task_change_messages',
      // freezeTableName: true,
    }
  );
}
