import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface RepeatTimeInstance extends DefaultInstance {
  triggered: boolean;
  originalTrigger: number;
  triggersAt: number;
  Repeat: any;
  canEdit: boolean;
  canCreateTask: boolean;
  rights: any;
}

export default function defineRepeatTimes(sequelize: Sequelize) {
  sequelize.define<RepeatTimeInstance>(
    "RepeatTime",
    {
      originalTrigger: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      triggersAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      triggered: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      //OPTIONS
      tableName: 'repeat_times',
      // freezeTableName: true,
    }
  );
}

export function createRepeatTimesAssoc(models) {
  models.RepeatTime.belongsTo(models.Repeat);
  models.RepeatTime.hasOne(models.Task, { constraints: false });
}
