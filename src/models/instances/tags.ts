import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface TagInstance extends DefaultInstance {
  title: string;
  color: string;
}

export default function defineTags( sequelize: Sequelize ){
  sequelize.define<TagInstance>(
    "Tag",
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
    },
    {
      //OPTIONS
      tableName: 'tags',
      // freezeTableName: true,
    }
  );
}
