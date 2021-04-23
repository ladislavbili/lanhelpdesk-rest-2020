import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface RepeatInstance extends DefaultInstance {
  repeatEvery: number;
  repeatInterval: string;
  startsAt: number;
  active: boolean;
  RepeatTemplate: any;
  canEdit: boolean;
}

export default function defineRepeats(sequelize: Sequelize) {
  sequelize.define<RepeatInstance>(
    "Repeat",
    {
      repeatEvery: {
        type: DataTypes.BIGINT,
        allowNull: false,
      },
      repeatInterval: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      startsAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      //OPTIONS
      tableName: 'repeat',
      // freezeTableName: true,
    }
  );
}

export function createRepeatsAssoc(models) {
  models.Repeat.hasMany(models.Task);
  models.Repeat.hasOne(models.RepeatTemplate, { onDelete: 'CASCADE' });
  models.Repeat.hasMany(models.RepeatTime, { onDelete: 'CASCADE' });
}
