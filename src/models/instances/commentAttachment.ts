import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface CommentAttachmentInstance extends DefaultInstance {
  filename: string;
  mimetype: string;
  size: number;
  contentDisposition: string;
  path: string;
  //Comment
}

export default function defineCommentAttachments(sequelize: Sequelize) {
  sequelize.define<CommentAttachmentInstance>(
    "CommentAttachment",
    {
      filename: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      mimetype: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      size: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      contentDisposition: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      path: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      //OPTIONS
      tableName: 'comment_attachments',
      // freezeTableName: true,
    }
  );
}

export function createCommentAttachmentsAssoc(models) {
  models.CommentAttachment.belongsTo(models.Comment, { foreignKey: { allowNull: false } });
}
