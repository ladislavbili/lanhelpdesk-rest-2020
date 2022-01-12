import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface LanwikiFileInstance extends DefaultInstance {
  filename: string;
  mimetype: string;
  encoding: string;
  path: string;
  size: number;
  //task
}

export default function defineLanwikiFiles(sequelize: Sequelize) {
  sequelize.define<LanwikiFileInstance>(
    "LanwikiFile",
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
      tableName: 'lanwiki_files',
      // freezeTableName: true,
    }
  );
}

export function createLanwikiFilesAssoc(models) {
  models.LanwikiFile.belongsTo(models.LanwikiPage);
}
