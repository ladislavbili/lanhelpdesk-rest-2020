import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface TaskInstance extends DefaultInstance {
  title: string;
  important: boolean;
  assignedTos: any;
  Tags: any;
  //tags
  //company - X
  //createdBy - X
  deadline: number; // X
  description: string; // X
  //milestone - ? X
  overtime: boolean; //X
  pausal: boolean; //X
  //project - // X
  /*
  repeatEvery
  repeatInterval
  startsAt
  */
  //requester - ? X
  //status - X
  pendingChangable: boolean; //X
  pendingDate: number; //X
  closeDate: number; //X
  statusChange: number; //X
  invoicedDate: number; //X
  invoiced: boolean;
  //taskType - X
  setStatus?: any;
  setCompany?: any;
  setTaskType?: any;
  setMilestone?: any;
  setRequester?: any;
  setAssignedTos?: any;
  setProject?: any;
  setTags?: any;
  setRepeat?: any;

  getAssignedTos?: any;
  getRequester?: any;
  getRepeat?: any;
  createTaskChange?: any;
  createRepeat?: any;
  createTaskAttachment?: any;
  createTaskMetadata?: any;
  getTaskMetadata?: any;

  subtasksQuantity?: number;
  workTripsQuantity?: number;
  materialsPrice?: number;

  rights?: any;
}

export default function defineTasks(sequelize: Sequelize) {
  sequelize.define<TaskInstance>(
    "Task",
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
      deadline: {
        type: DataTypes.DATE,
        allowNull: true,
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
      invoicedDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      invoiced: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      //OPTIONS
      tableName: 'tasks',
      // freezeTableName: true,
    }
  );
}

export function createTasksAssoc(models) {
  models.Task.hasMany(models.UserNotification);

  models.Task.belongsToMany(models.User, { as: { singular: "assignedTo", plural: "assignedTos" }, through: 'task_assignedTo' });

  models.Task.belongsToMany(models.User, { as: { singular: "assignedToFilter", plural: "assignedTosFilter" }, through: 'task_assignedTo' });

  models.Task.belongsTo(models.Company, { foreignKey: { allowNull: false } });

  models.Task.hasOne(models.TaskMetadata, { onDelete: 'CASCADE', as: "TaskMetadata", foreignKey: { name: 'TaskId', allowNull: false } });

  models.Task.belongsTo(models.User, { as: 'createdBy' });

  models.Task.belongsTo(models.Milestone);

  models.Task.belongsTo(models.Project, { foreignKey: { allowNull: false } });

  models.Task.belongsTo(models.User, { as: 'requester' });

  models.Task.belongsTo(models.Status, { foreignKey: { allowNull: false } });

  models.Task.belongsToMany(models.Tag, { through: 'task_has_tags' });

  models.Task.belongsToMany(models.Tag, { as: { singular: "tagFilter", plural: "tagsFilter" }, through: 'task_has_tags' });

  models.Task.belongsTo(models.TaskType);

  models.Task.belongsTo(models.Repeat);
  models.Task.belongsTo(models.RepeatTime);

  models.Task.hasMany(models.ShortSubtask, { onDelete: 'CASCADE' });

  models.Task.hasMany(models.ScheduledTask, { onDelete: 'CASCADE' });

  models.Task.hasMany(models.Subtask, { onDelete: 'CASCADE' });

  models.Task.hasMany(models.WorkTrip, { onDelete: 'CASCADE' });

  models.Task.hasMany(models.Material, { onDelete: 'CASCADE' });

  models.Task.hasMany(models.CustomItem, { onDelete: 'CASCADE' });

  models.Task.hasMany(models.Comment, { onDelete: 'CASCADE' });

  models.Task.hasMany(models.TaskChange, { onDelete: 'CASCADE' });

  models.Task.hasMany(models.TaskAttachment, { onDelete: 'CASCADE' });

  models.Task.hasMany(models.InvoicedTask);
  models.Task.hasMany(models.InvoicedMaterialTask);
}
