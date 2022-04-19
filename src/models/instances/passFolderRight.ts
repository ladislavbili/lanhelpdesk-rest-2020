import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface PassFolderRightInstance extends DefaultInstance {
  active: boolean;
  read: boolean;
  write: boolean;
  manage: boolean;
}

export default function definePassFolderRights(sequelize: Sequelize) {
  sequelize.define<PassFolderRightInstance>(
    "PassFolderRight",
    {
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      write: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      manage: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
    },
    {
      //OPTIONS
      tableName: 'pass_folder_rights',
      // freezeTableName: true,
    }
  );
}

export function createPassFolderRightsAssoc(models) {
  models.PassFolderRight.belongsTo(models.User);
  models.PassFolderRight.belongsTo(models.PassFolder);
}
