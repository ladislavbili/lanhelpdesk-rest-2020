import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface EmailAttachmentInstance extends DefaultInstance {
  filename: string;
  mimetype: string;
  size: number;
  contentDisposition: string;
  path: string;
  //Email
}

export default function defineEmailAttachments(sequelize: Sequelize) {
  sequelize.define<EmailAttachmentInstance>(
    "EmailAttachment",
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
      tableName: 'email_attachments',
      // freezeTableName: true,
    }
  );
}

export function createEmailAttachmentsAssoc(models) {
  models.EmailAttachment.belongsTo(models.Comment, { foreignKey: { allowNull: false } });
}
