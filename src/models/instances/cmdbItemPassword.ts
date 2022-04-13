import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface CMDBItemPasswordInstance extends DefaultInstance {
  title: string;
  login: string;
  password: string;
  url: string;
  expireDate: number;
  note: string;
}

export default function defineCMDBItemPasswords(sequelize: Sequelize) {
  sequelize.define<CMDBItemPasswordInstance>(
    "CMDBItemPassword",
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
      tableName: 'cmdb_item_passwords',
      // freezeTableName: true,
    }
  );
}

export function createCMDBItemPasswordsAssoc(models) {
  models.CMDBItemPassword.belongsTo(models.CMDBItem);

}
