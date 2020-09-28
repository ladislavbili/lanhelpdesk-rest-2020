import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface TaskChangeInstance extends DefaultInstance {
  //task
  //user
  //taskChangeMessages
}

export default function defineTaskChanges(sequelize: Sequelize) {
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

export function createTaskChangesAssoc(models) {
  models.TaskChange.belongsTo(models.Task, { foreignKey: { allowNull: false } });

  models.TaskChange.belongsTo(models.User);

  models.TaskChange.hasMany(models.TaskChangeMessage, { onDelete: 'CASCADE' });
}
