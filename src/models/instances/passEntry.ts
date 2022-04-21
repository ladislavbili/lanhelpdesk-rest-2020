import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface PassEntryInstance extends DefaultInstance {
  title: string;
  login: string;
  password: string;
  url: string;
  expireDate: number;
  note: string;

  getPassFolder?:any;
}

export default function definePassEntries(sequelize: Sequelize) {
  sequelize.define<PassEntryInstance>(
    "PassEntry",
    {
      title: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      login: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ""
      },
      password: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      url: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ""
      },
      expireDate: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ""
      },
    },
    {
      //OPTIONS
      tableName: 'pass_entries',
      // freezeTableName: true,
    }
  );
}

export function createPassEntriesAssoc(models) {
  models.PassEntry.belongsTo(models.PassFolder);
  models.PassEntry.belongsTo(models.User, { as: 'createdBy' });
  models.PassEntry.belongsTo(models.User, { as: 'changedBy' });
}
