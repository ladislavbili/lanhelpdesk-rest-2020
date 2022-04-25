import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface RepeatTemplateInstance extends DefaultInstance {
  title: string;
  important: boolean;
  //assignedTo []
  //tags
  //company - X
  //createdBy - X
  daysToDeadline: number; // X
  description: string; // X
  //milestone - ? X
  overtime: boolean; //X
  pausal: boolean; //X
  //project - // X
  //repeat
  //requester - ? X
  //status - X
  pendingChangable: boolean; //X
  pendingDate: number; //X
  closeDate: number; //X
  statusChange: number; //X
  //TaskType - X
  createRepeatTemplateAttachment?: any;

  setStatus?: any;
  setCompany?: any;
  setTaskType?: any;
  setMilestone?: any;
  setRequester?: any;
  setAssignedTos?: any;
  setProject?: any;
  setTags?: any;

  getAssignedTos?: any;
  getRequester?: any;
  getRepeat?: any;
  createRepeat?: any;
  setRepeat?: any;
}

export default function defineRepeatTemplates(sequelize: Sequelize) {
  sequelize.define<RepeatTemplateInstance>(
    "RepeatTemplate",
    {
      title: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      important: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      closeDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      daysToDeadline: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ""
      },
      overtime: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      pausal: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      pendingChangable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      pendingDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      statusChange: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      //OPTIONS
      tableName: 'repeat_templates',
      // freezeTableName: true,
    }
  );
}

export function createRepeatTemplatesAssoc(models) {
  models.RepeatTemplate.belongsToMany(models.User, { as: { singular: "assignedTo", plural: "assignedTos" }, through: 'repeat_template_assignedTo' });

  models.RepeatTemplate.belongsTo(models.Company, { foreignKey: { allowNull: false } });

  models.RepeatTemplate.belongsTo(models.User, { as: 'createdBy' });

  models.RepeatTemplate.belongsTo(models.Milestone);

  models.RepeatTemplate.belongsTo(models.Project, { foreignKey: { allowNull: false } });

  models.RepeatTemplate.belongsTo(models.User, { as: 'requester' });

  models.RepeatTemplate.belongsTo(models.Status, { foreignKey: { allowNull: false } });

  models.RepeatTemplate.belongsToMany(models.Tag, { through: 'repeat_template_has_tags' });

  models.RepeatTemplate.belongsTo(models.TaskType);

  models.RepeatTemplate.belongsTo(models.Repeat, { onDelete: 'CASCADE' });

  models.RepeatTemplate.hasMany(models.ShortSubtask, { onDelete: 'CASCADE' });

  models.RepeatTemplate.hasMany(models.Subtask, { onDelete: 'CASCADE' });

  models.RepeatTemplate.hasMany(models.WorkTrip, { onDelete: 'CASCADE' });

  models.RepeatTemplate.hasMany(models.Material, { onDelete: 'CASCADE' });

  //models.RepeatTemplate.hasMany(models.CalendarEvent, { onDelete: 'CASCADE' });

  models.RepeatTemplate.hasMany(models.RepeatTemplateAttachment, { onDelete: 'CASCADE' });
}
