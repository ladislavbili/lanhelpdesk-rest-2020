import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface ScheduledWorkInstance extends DefaultInstance {
  from: number;
  to: number;
  canEdit?: Boolean;
  Task?: any;
  User?: any;
  Subtask?: any;
  WorkTrip?: any;
}

export default function defineScheduledWorks(sequelize: Sequelize) {
  sequelize.define<ScheduledWorkInstance>(
    "ScheduledWork",
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
      tableName: 'scheduled_work',
      // freezeTableName: true,
    }
  );
}

export function createScheduledWorksAssoc(models) {
  models.ScheduledWork.belongsTo(models.WorkTrip);
  models.ScheduledWork.belongsTo(models.Subtask);
}
