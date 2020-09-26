import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface CommentInstance extends DefaultInstance {
  message: string;
  rawMessage: string;
  html: string;
  rawHtml: string;
  //from user
  //task
  //parentcomment
  //emailTagrets
  internal: boolean;
  subject: string;
  isEmail: boolean;
  emailSend: boolean;
  emailError: string;
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
      rawMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      html: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      rawHtml: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      subject: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isEmail: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      emailSend: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      emailError: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
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
