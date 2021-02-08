import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface RepeatTemplateAttachmentInstance extends DefaultInstance {
  filename: string;
  mimetype: string;
  encoding: string;
  path: string;
  size: number;
  //RepeatTemplate
}

export default function defineRepeatTemplateAttachments(sequelize: Sequelize) {
  sequelize.define<RepeatTemplateAttachmentInstance>(
    "RepeatTemplateAttachment",
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
      tableName: 'repeat_template_attachments',
      // freezeTableName: true,
    }
  );
}

export function createRepeatTemplateAttachmentsAssoc(models) {
  models.RepeatTemplateAttachment.belongsTo(models.User);
  models.RepeatTemplateAttachment.belongsTo(models.RepeatTemplate, { foreignKey: { allowNull: false } });
}
