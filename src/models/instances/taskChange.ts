import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface TaskChangeInstance extends DefaultInstance {
  //task
  //user
  //taskChangeMessages
}

export default function defineTaskChanges( sequelize: Sequelize ){
  sequelize.define<TaskChangeInstance>(
    "TaskChange",
    {
    },
    {
      //OPTIONS
      tableName: 'task_change',
      // freezeTableName: true,
    }
  );
}
