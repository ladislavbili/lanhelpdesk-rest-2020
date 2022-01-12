import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface LanwikiPageInstance extends DefaultInstance {
  title: string;
  body: string;
  isAdmin: boolean;
  setLanwikiTags?: any;
  getLanwikiFolder?: any;
  createLanwikiFile?: any;
}

export default function defineLanwikiPages(sequelize: Sequelize) {
  sequelize.define<LanwikiPageInstance>(
    "LanwikiPage",
    {
      title: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      body: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ""
      },
    },
    {
      //OPTIONS
      tableName: 'lanwiki_pages',
      // freezeTableName: true,
    }
  );
}

export function createLanwikiPagesAssoc(models) {
  models.LanwikiPage.belongsTo(models.LanwikiFolder);
  models.LanwikiPage.belongsToMany(models.LanwikiTag, { through: 'lanwiki_tag_in_page', as: { singular: 'lanwikiTagFilter', plural: 'lanwikiTagsFilter' } });
  models.LanwikiPage.belongsToMany(models.LanwikiTag, { through: 'lanwiki_tag_in_page' });
  models.LanwikiPage.hasMany(models.LanwikiFile, { onDelete: 'CASCADE' });
}
