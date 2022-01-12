import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface LanwikiFolderInstance extends DefaultInstance {
  title: string;
  archived: boolean;
  order: number;
  description: string;
  isAdmin: boolean;

  createLanwikiFolderRight?: any;
  getLanwikiPages?: any;
  getLanwikiFolderRights?: any;
}

export default function defineLanwikiFolders(sequelize: Sequelize) {
  sequelize.define<LanwikiFolderInstance>(
    "LanwikiFolder",
    {
      title: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      archived: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
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
      tableName: 'lanwiki_folders',
      // freezeTableName: true,
    }
  );
}

export function createLanwikiFoldersAssoc(models) {
  models.LanwikiFolder.hasMany(models.LanwikiFolderRight, { onDelete: 'CASCADE' });
  models.LanwikiFolder.hasMany(models.LanwikiPage, { onDelete: 'CASCADE' });
}
