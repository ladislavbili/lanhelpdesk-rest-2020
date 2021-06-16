import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface ProjectAttachmentInstance extends DefaultInstance {
  filename: string;
  mimetype: string;
  encoding: string;
  path: string;
  size: number;
  //task
}

export default function defineProjectAttachments(sequelize: Sequelize) {
  sequelize.define<ProjectAttachmentInstance>(
    "ProjectAttachment",
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
      tableName: 'project_attachments',
      // freezeTableName: true,
    }
  );
}

export function createProjectAttachmentsAssoc(models) {
  models.ProjectAttachment.belongsTo(models.User);
  models.ProjectAttachment.belongsTo(models.Project, { foreignKey: { allowNull: false } });
}
