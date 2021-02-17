import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface ProjectInstance extends DefaultInstance {
  title: string;
  description: string;
  lockedRequester: boolean;

  defAssignedToDef: boolean;
  defAssignedToFixed: boolean;
  defAssignedToRequired: boolean;

  defCompanyDef: boolean;
  defCompanyFixed: boolean;
  defCompanyRequired: boolean;

  defOvertimeDef: boolean;
  defOvertimeFixed: boolean;
  defOvertimeRequired: boolean;
  defOvertimeValue: boolean;

  defPausalDef: boolean;
  defPausalFixed: boolean;
  defPausalRequired: boolean;
  defPausalValue: boolean;

  defRequesterDef: boolean;
  defRequesterFixed: boolean;
  defRequesterRequired: boolean;

  defStatusDef: boolean;
  defStatusFixed: boolean;
  defStatusRequired: boolean;

  defTagDef: boolean;
  defTagFixed: boolean;
  defTagRequired: boolean;

  defTaskTypeDef: boolean;
  defTaskTypeFixed: boolean;
  defTaskTypeRequired: boolean;

  createTag?: any;
  createProjectStatus?: any;
  createProjectGroup?: any;

  getDefAssignedTos?: any;
  getDefCompany?: any;
  getDefRequester?: any;
  getDefStatus?: any;
  getDefTags?: any;
  getDefTaskType?: any;

  setDefAssignedTos?: any;
  setDefTags?: any;
  setDefCompany?: any;
  setDefStatus?: any;
  setDefRequester?: any;
  setDefTaskType?: any;

  removeDefAssignedTo?: any;
  removeDefTag?: any;
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

      def: {
        type: DataTypes.VIRTUAL,
        async get() {
          const [
            assignedTos,
            company,
            requester,
            status,
            tag,
            taskType
          ] = await Promise.all([
            this.getDefAssignedTos(),
            this.getDefCompany(),
            this.getDefRequester(),
            this.getDefStatus(),
            this.getDefTags(),
            this.getDefTaskType()
          ]);
          return {
            assignedTo: {
              def: this.get('defAssignedToDef'),
              fixed: this.get('defAssignedToFixed'),
              required: this.get('defAssignedToRequired'),
              value: assignedTos
            },
            company: {
              def: this.get('defCompanyDef'),
              fixed: this.get('defCompanyFixed'),
              required: this.get('defCompanyRequired'),
              value: company
            },
            overtime: {
              def: this.get('defOvertimeDef'),
              fixed: this.get('defOvertimeFixed'),
              required: this.get('defOvertimeRequired'),
              value: this.get('defOvertimeValue'),
            },
            pausal: {
              def: this.get('defPausalDef'),
              fixed: this.get('defPausalFixed'),
              required: this.get('defPausalRequired'),
              value: this.get('defPausalValue'),
            },
            requester: {
              def: this.get('defRequesterDef'),
              fixed: this.get('defRequesterFixed'),
              required: this.get('defRequesterRequired'),
              value: requester
            },
            status: {
              def: this.get('defStatusDef'),
              fixed: this.get('defStatusFixed'),
              required: this.get('defStatusRequired'),
              value: status
            },
            tag: {
              def: this.get('defTagDef'),
              fixed: this.get('defTagFixed'),
              required: this.get('defTagRequired'),
              value: tag
            },
            type: {
              def: this.get('defTaskTypeDef'),
              fixed: this.get('defTaskTypeFixed'),
              required: this.get('defTaskTypeRequired'),
              value: taskType
            },
          }
        }
      },

      defAssignedToDef: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      defAssignedToFixed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      defAssignedToRequired: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      defCompanyDef: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      defCompanyFixed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      defCompanyRequired: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      defOvertimeDef: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      defOvertimeFixed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      defOvertimeRequired: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      defOvertimeValue: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      defPausalDef: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      defPausalFixed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      defPausalRequired: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      defPausalValue: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      defRequesterDef: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      defRequesterFixed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      defRequesterRequired: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      defStatusDef: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      defStatusFixed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      defStatusRequired: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },

      defTagDef: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      defTagFixed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      defTagRequired: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      defTaskTypeDef: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      defTaskTypeFixed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      defTaskTypeRequired: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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

  models.Project.belongsToMany(models.User, { as: { singular: "defAssignedTo", plural: "defAssignedTos" }, through: 'project_def_assignedTos' });

  models.Project.belongsTo(models.Company, { as: 'defCompany' });

  models.Project.belongsTo(models.User, { as: 'defRequester' });

  models.Project.hasOne(models.Status, { as: 'defStatus' });

  models.Project.belongsToMany(models.Tag, { as: 'defTags', through: 'project_def_tags' });

  models.Project.hasMany(models.Tag, { as: 'tags' }, { onDelete: 'CASCADE' });

  models.Project.belongsTo(models.TaskType, { as: 'defTaskType' });

  models.Project.hasMany(models.Filter, { as: { singular: "filterOfProject", plural: "filterOfProjects" } });

  models.Project.hasMany(models.Milestone, { onDelete: 'CASCADE' });

  models.Project.hasMany(models.Task, { onDelete: 'CASCADE' });

  models.Project.hasMany(models.RepeatTemplate, { onDelete: 'CASCADE' });

  models.Project.hasMany(models.ProjectGroup, { onDelete: 'CASCADE' });
}
