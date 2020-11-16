import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface FilterInstance extends DefaultInstance {
  title: string;
  pub: boolean;
  global: boolean;
  dashboard: boolean;
  order: number;

  assignedToCur: false;
  //assignedTo: cur;
  requesterCur: false;
  //requester: ;
  companyCur: false;
  //company: ;
  //taskType: ;
  //oneOf
  statusDateFrom: number;
  statusDateFromNow: boolean;
  statusDateTo: number;
  statusDateToNow: boolean;

  pendingDateFrom: number;
  pendingDateFromNow: boolean;
  pendingDateTo: number;
  pendingDateToNow: boolean;

  closeDateFrom: number;
  closeDateFromNow: boolean;
  closeDateTo: number;
  closeDateToNow: boolean;

  deadlineFrom: number;
  deadlineFromNow: boolean;
  deadlineTo: number;
  deadlineToNow: boolean;

  getFilterAssignedTo?: any;
  getFilterRequester?: any;
  getFilterCompany?: any;
  getFilterTaskType?: any;
  getFilterOneOfs?: any;
  getFilterCreatedBy?: any;

  setRoles?: any;
  setFilterAssignedTo?: any;
  setFilterRequester?: any;
  setFilterCompany?: any;
  setFilterTaskType?: any;
  setFilterOneOfs?: any;
  setFilterOfProject?: any;

  createFilterOneOf?: any;
}

export default function defineFilter(sequelize: Sequelize) {
  sequelize.define<FilterInstance>(
    "Filter",
    {
      title: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: 'Filter',
      },
      pub: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      global: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      dashboard: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      createdBy: {
        type: DataTypes.VIRTUAL,
        async get() {
          return this.getFilterCreatedBy()
        }
      },
      filter: {
        type: DataTypes.VIRTUAL,
        async get() {
          const [
            assignedTo,
            requester,
            company,
            taskType,
            oneOfResponse,
          ] = await Promise.all([
            this.getFilterAssignedTo(),
            this.getFilterRequester(),
            this.getFilterCompany(),
            this.getFilterTaskType(),
            this.getFilterOneOfs(),
          ]);

          return {
            assignedToCur: this.get('assignedToCur'),
            assignedTo,
            requesterCur: this.get('requesterCur'),
            requester,
            companyCur: this.get('companyCur'),
            company,
            taskType,
            oneOf: oneOfResponse.map((oneOf) => oneOf.get('input')),

            statusDateFrom: this.get('statusDateFrom'),
            statusDateFromNow: this.get('statusDateFromNow'),
            statusDateTo: this.get('statusDateTo'),
            statusDateToNow: this.get('statusDateToNow'),

            pendingDateFrom: this.get('pendingDateFrom'),
            pendingDateFromNow: this.get('pendingDateFromNow'),
            pendingDateTo: this.get('pendingDateTo'),
            pendingDateToNow: this.get('pendingDateToNow'),

            closeDateFrom: this.get('closeDateFrom'),
            closeDateFromNow: this.get('closeDateFromNow'),
            closeDateTo: this.get('closeDateTo'),
            closeDateToNow: this.get('closeDateToNow'),

            deadlineFrom: this.get('deadlineFrom'),
            deadlineFromNow: this.get('deadlineFromNow'),
            deadlineTo: this.get('deadlineTo'),
            deadlineToNow: this.get('deadlineToNow'),
          }
        }
      },

      assignedToCur: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      requesterCur: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      companyCur: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      statusDateFrom: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      statusDateFromNow: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      statusDateTo: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      statusDateToNow: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      pendingDateFrom: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      pendingDateFromNow: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      pendingDateTo: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      pendingDateToNow: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      closeDateFrom: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      closeDateFromNow: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      closeDateTo: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      closeDateToNow: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      deadlineFrom: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      deadlineFromNow: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      deadlineTo: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      deadlineToNow: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

    },
    {
      //OPTIONS
      tableName: 'filters',
      // freezeTableName: true,
    }
  );
}

export function createFilterAssoc(models) {
  models.Filter.belongsTo(models.User, { as: 'filterCreatedBy' });

  models.Filter.hasMany(models.FilterOneOf, { onDelete: 'CASCADE' });

  models.Filter.belongsTo(models.User, { as: 'filterAssignedTo' });

  models.Filter.belongsTo(models.User, { as: 'filterRequester' });

  models.Filter.belongsTo(models.Company, { as: 'filterCompany' });

  models.Filter.belongsTo(models.TaskType, { as: 'filterTaskType' });

  models.Filter.belongsTo(models.Project, { as: 'filterOfProject' });

  models.Filter.belongsToMany(models.Role, { through: 'filter_access_roles' });
}
