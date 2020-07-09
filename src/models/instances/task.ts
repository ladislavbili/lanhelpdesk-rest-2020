import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface TaskInstance extends DefaultInstance {
  title: string;
  setTags?: any;
}

export default function defineTasks( sequelize: Sequelize ){
  sequelize.define<TaskInstance>(
    "Task",
    {
      title: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      //OPTIONS
      tableName: 'tasks',
      // freezeTableName: true,
    }
  );
}
