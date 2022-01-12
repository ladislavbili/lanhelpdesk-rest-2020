import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface LanwikiFolderRightInstance extends DefaultInstance {
  active: boolean;
  read: boolean;
  write: boolean;
  manage: boolean;
}

export default function defineLanwikiFolderRights(sequelize: Sequelize) {
  sequelize.define<LanwikiFolderRightInstance>(
    "LanwikiFolderRight",
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
      tableName: 'lanwiki_folder_rights',
      // freezeTableName: true,
    }
  );
}

export function createLanwikiFolderRightsAssoc(models) {
  models.LanwikiFolderRight.belongsTo(models.User);
  models.LanwikiFolderRight.belongsTo(models.LanwikiFolder);
}
