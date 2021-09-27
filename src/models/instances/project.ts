import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface ProjectInstance extends DefaultInstance {
  title: string;
  description: string;
  lockedRequester: boolean;
  autoApproved: boolean;
  hideAprooved: boolean;
  archived: boolean;

  createTag?: any;
  createFilterOfProject?: any;
  createProjectStatus?: any;
  createProjectGroup?: any;
  createProjectAttachment?: any;
  createProjectAttribute?: any;

  getTasks?: any;
  getProjectAttribute?: any;
  getProjectGroups?: any;
}

export default function defineProjects(sequelize: Sequelize) {
  sequelize.define<ProjectInstance>(
    "Project",
    {
      title: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      lockedRequester: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      autoApproved: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      hideApproved: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      archived: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      //OPTIONS
      tableName: 'projects',
      // freezeTableName: true,
    }
  );
}


export function createProjectsAssoc(models) {
  models.Project.hasMany(models.Imap, { foreignKey: { allowNull: false } });

  models.Project.hasMany(models.Status, { as: { singular: 'projectStatus', plural: 'projectStatuses' } });

  models.Project.hasMany(models.Tag, { as: 'tags' }, { onDelete: 'CASCADE' });

  models.Project.hasMany(models.Filter, { as: { singular: "filterOfProject", plural: "filterOfProjects" } });

  models.Project.hasMany(models.Milestone, { onDelete: 'CASCADE' });

  models.Project.hasMany(models.Task, { onDelete: 'CASCADE' });

  models.Project.hasMany(models.TasklistColumnPreference, { onDelete: 'CASCADE', as: { singular: "TasklistColumnPreference", plural: "TasklistColumnPreferences" }, foreignKey: { name: 'ProjectId', allowNull: true } });

  models.Project.hasMany(models.TasklistGanttColumnPreference, { onDelete: 'CASCADE', as: { singular: "TasklistGanttColumnPreference", plural: "TasklistGanttColumnPreferences" }, foreignKey: { name: 'ProjectId', allowNull: true } });

  models.Project.hasMany(models.RepeatTemplate, { onDelete: 'CASCADE' });

  models.Project.hasMany(models.ProjectGroup, { onDelete: 'CASCADE' });

  models.Project.hasMany(models.ProjectAttachment, { onDelete: 'CASCADE' });

  models.Project.hasOne(models.ProjectAttributes, { onDelete: 'CASCADE' });
}
