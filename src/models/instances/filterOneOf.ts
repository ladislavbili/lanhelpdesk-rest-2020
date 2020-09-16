import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface FilterOneOfInstance extends DefaultInstance {
  input: string;
}

export default function defineFilterOneOf(sequelize: Sequelize) {
  sequelize.define<FilterOneOfInstance>(
    "FilterOneOf",
    {
      input: {
        type: DataTypes.TEXT,
        allowNull: false,
      }
    },
    {
      //OPTIONS
      tableName: 'filter_oneOf',
      // freezeTableName: true,
    }
  );
}
