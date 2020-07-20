import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface TaskTypeInstance extends DefaultInstance {
  title: string;
  order: number;
}

export default function defineTaskTypes( sequelize: Sequelize ){
  sequelize.define<TaskTypeInstance>(
    "TaskType",
    {
      title: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
    },
    {
      //OPTIONS
      tableName: 'task_types',
      // freezeTableName: true,
    }
  );
}
