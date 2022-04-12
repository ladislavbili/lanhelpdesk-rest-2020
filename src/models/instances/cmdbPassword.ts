import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface CMDBPasswordInstance extends DefaultInstance {
  title: string;
  login: string;
  password: string;
  url: string;
  expireDate: number;
  note: string;
}

export default function defineCMDBPasswords(sequelize: Sequelize) {
  sequelize.define<CMDBPasswordInstance>(
    "CMDBPassword",
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
      tableName: 'cmdb_passwords',
      // freezeTableName: true,
    }
  );
}

export function createCMDBPasswordsAssoc(models) {
  models.CMDBPassword.belongsTo(models.Company);
  models.CMDBPassword.belongsTo(models.User, { as: 'createdBy' });
  models.CMDBPassword.belongsTo(models.User, { as: 'changedBy' });

}
