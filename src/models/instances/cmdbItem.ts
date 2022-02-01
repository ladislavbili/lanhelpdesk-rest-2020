import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface CMDBItemInstance extends DefaultInstance {
  title: string;
  active: boolean;
  location: string;
  installDate: string;
  expireDate: string;
  hardware: string;
  serialNumber: string;
  description: string;
  backup: string;
  monitoring: string;
}

export default function defineCMDBItems(sequelize: Sequelize) {
  sequelize.define<CMDBItemInstance>(
    "CMDBItem",
    {
      title: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      location: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ""
      },
      installDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      expireDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ""
      },
      backup: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ""
      },
      monitoring: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ""
      },
      hardware: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ""
      },
      serialNumber: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ""
      },
    },
    {
      //OPTIONS
      tableName: 'cmdb_items',
      // freezeTableName: true,
    }
  );
}

export function createCMDBItemsAssoc(models) {
  models.CMDBItem.belongsTo(models.Company);
  models.CMDBItem.belongsTo(models.CMDBCategory);
  models.CMDBItem.belongsTo(models.User, { as: 'createdBy' });
  models.CMDBItem.belongsTo(models.User, { as: 'changedBy' });
  models.CMDBItem.hasMany(models.CMDBAddress, { onDelete: 'CASCADE', as: { singular: 'CMDBAddress', plural: 'CMDBAddresses' } });
  models.CMDBItem.hasMany(models.CMDBAddress, { as: { singular: 'addressFilter', plural: 'addressesFilter' } });
  models.CMDBItem.hasMany(models.CMDBFile, { onDelete: 'CASCADE', foreignKey: 'descriptionFileId', as: { singular: 'descriptionFile', plural: 'descriptionFiles' } });
  models.CMDBItem.hasMany(models.CMDBFile, { onDelete: 'CASCADE', foreignKey: 'backupFileId', as: { singular: 'backupFile', plural: 'backupFiles' } });
  models.CMDBItem.hasMany(models.CMDBFile, { onDelete: 'CASCADE', foreignKey: 'monitoringFileId', as: { singular: 'monitoringFile', plural: 'monitoringFiles' } });
}
