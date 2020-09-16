import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface ProjectInstance extends DefaultInstance {
  title: string;
  descrption: string;
  lockedRequester: boolean;

  defAssignedToDef: boolean;
  defAssignedToFixed: boolean;
  defAssignedToShow: boolean;

  defCompanyDef: boolean;
  defCompanyFixed: boolean;
  defCompanyShow: boolean;

  defOvertimeDef: boolean;
  defOvertimeFixed: boolean;
  defOvertimeShow: boolean;
  defOvertimeValue: boolean;

  defPausalDef: boolean;
  defPausalFixed: boolean;
  defPausalShow: boolean;
  defPausalValue: boolean;

  defRequesterDef: boolean;
  defRequesterFixed: boolean;
  defRequesterShow: boolean;

  defStatusDef: boolean;
  defStatusFixed: boolean;
  defStatusShow: boolean;

  defTagDef: boolean;
  defTagFixed: boolean;
  defTagShow: boolean;

  defTaskTypeDef: boolean;
  defTaskTypeFixed: boolean;
  defTaskTypeShow: boolean;

  createProjectRight?: any;

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
      descrption: {
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
          return {
            assignedTo: {
              def: this.get('defAssignedToDef'),
              fixed: this.get('defAssignedToFixed'),
              show: this.get('defAssignedToShow'),
              value: await this.getDefAssignedTos()
            },
            company: {
              def: this.get('defCompanyDef'),
              fixed: this.get('defCompanyFixed'),
              show: this.get('defCompanyShow'),
              value: await this.getDefCompany()
            },
            overtime: {
              def: this.get('defOvertimeDef'),
              fixed: this.get('defOvertimeFixed'),
              show: this.get('defOvertimeShow'),
              value: this.get('defOvertimeValue'),
            },
            pausal: {
              def: this.get('defPausalDef'),
              fixed: this.get('defPausalFixed'),
              show: this.get('defPausalShow'),
              value: this.get('defPausalValue'),
            },
            requester: {
              def: this.get('defRequesterDef'),
              fixed: this.get('defRequesterFixed'),
              show: this.get('defRequesterShow'),
              value: await this.getDefRequester()
            },
            status: {
              def: this.get('defStatusDef'),
              fixed: this.get('defStatusFixed'),
              show: this.get('defStatusShow'),
              value: await this.getDefStatus()
            },
            tag: {
              def: this.get('defTagDef'),
              fixed: this.get('defTagFixed'),
              show: this.get('defTagShow'),
              value: await this.getDefTags()
            },
            taskType: {
              def: this.get('defTaskTypeDef'),
              fixed: this.get('defTaskTypeFixed'),
              show: this.get('defTaskTypeShow'),
              value: await this.getDefTaskType()
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
      defAssignedToShow: {
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
      defCompanyShow: {
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
      defOvertimeShow: {
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
      defPausalShow: {
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
      defRequesterShow: {
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
      defStatusShow: {
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
      defTagShow: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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
      defTaskTypeShow: {
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
