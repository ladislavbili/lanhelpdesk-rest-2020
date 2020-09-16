import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface CommentInstance extends DefaultInstance {
  message: string;
  //from user
  //task
  //parentcomment
  internal: boolean;
  isParent: boolean;
}

export default function definecomments(sequelize: Sequelize) {
  sequelize.define<CommentInstance>(
    "Comment",
    {
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      internal: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      isParent: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      //OPTIONS
      tableName: 'comments',
      // freezeTableName: true,
    }
  );
}
