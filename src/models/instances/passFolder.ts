import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface PassFolderInstance extends DefaultInstance {
  title: string;
  order: number;
  description: string;
  isAdmin: boolean;

  createPassFolderRight?: any;
  getPassEntries?: any;
  getPassFolderRights?: any;
}

export default function definePassFolders(sequelize: Sequelize) {
  sequelize.define<PassFolderInstance>(
    "PassFolder",
    {
      title: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ""
      },
    },
    {
      //OPTIONS
      tableName: 'pass_folders',
      // freezeTableName: true,
    }
  );
}

export function createPassFoldersAssoc(models) {
  models.PassFolder.hasMany(models.PassFolderRight, { onDelete: 'CASCADE' });
  models.PassFolder.hasMany(models.PassEntry, { onDelete: 'CASCADE' });
}
