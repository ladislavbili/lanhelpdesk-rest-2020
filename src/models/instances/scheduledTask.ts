import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface ScheduledTaskInstance extends DefaultInstance {
  from: number;
  to: number;
}

export default function defineScheduledTasks(sequelize: Sequelize) {
  sequelize.define<ScheduledTaskInstance>(
    "ScheduledTask",
    {
      from: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      to: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      //OPTIONS
      tableName: 'scheduled_task',
      // freezeTableName: true,
    }
  );
}

export function createScheduledTasksAssoc(models) {
  models.ScheduledTask.belongsTo(models.Task);
  models.ScheduledTask.belongsTo(models.User);
}
