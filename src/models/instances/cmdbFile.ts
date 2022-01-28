import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface CMDBFileInstance extends DefaultInstance {
  filename: string;
  mimetype: string;
  encoding: string;
  path: string;
  size: number;
  //task
}

export default function defineCMDBFiles(sequelize: Sequelize) {
  sequelize.define<CMDBFileInstance>(
    "CMDBFile",
    {
      filename: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      mimetype: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      encoding: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      path: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      size: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      //OPTIONS
      tableName: 'cmdb_files',
      // freezeTableName: true,
    }
  );
}

export function createCMDBFilesAssoc(models) {
  models.CMDBFile.belongsTo(models.CMDBItem, { as: 'descriptionFile' });
  models.CMDBFile.belongsTo(models.CMDBItem, { as: 'backupFile' });
  models.CMDBFile.belongsTo(models.CMDBItem, { as: 'monitoringFile' });
  models.CMDBFile.belongsTo(models.CMDBManual);
  models.CMDBFile.belongsTo(models.CMDBScheme);
}
