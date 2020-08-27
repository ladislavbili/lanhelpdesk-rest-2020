import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface RepeatInstance extends DefaultInstance {
  repeatEvery: number;
  repeatInterval: string;
  startsAt: number;
}

export default function defineRepeats( sequelize: Sequelize ){
  sequelize.define<RepeatInstance>(
    "Repeat",
    {
      repeatEvery: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      repeatInterval: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      startsAt: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      //OPTIONS
      tableName: 'repeat',
      // freezeTableName: true,
    }
  );
}
