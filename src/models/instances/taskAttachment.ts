import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface TaskAttachmentInstance extends DefaultInstance {
  filename: string;
  mimetype: string;
  encoding: string;
  path: string;
  size: number;
  //task
}

export default function defineTaskAttachments(sequelize: Sequelize) {
  sequelize.define<TaskAttachmentInstance>(
    "TaskAttachment",
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
      tableName: 'task_attachments',
      // freezeTableName: true,
    }
  );
}

export function createTaskAttachmentsAssoc(models) {
  models.TaskAttachment.belongsTo(models.User);
  models.TaskAttachment.belongsTo(models.Task, { foreignKey: { allowNull: false } });
}
