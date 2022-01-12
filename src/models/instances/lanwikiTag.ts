import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface LanwikiTagInstance extends DefaultInstance {
  title: string;
  color: string;
  order: number;
  description: string;
}

export default function defineLanwikiTags(sequelize: Sequelize) {
  sequelize.define<LanwikiTagInstance>(
    "LanwikiTag",
    {
      title: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      color: {
        type: DataTypes.TEXT({ length: "tiny" }),
        allowNull: false,
        defaultValue: "#f759f2"
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
      tableName: 'lanwiki_tags',
      // freezeTableName: true,
    }
  );
}

export function createLanwikiTagsAssoc(models) {
  models.LanwikiTag.belongsToMany(models.LanwikiPage, { through: 'lanwiki_tag_in_page' });
}
