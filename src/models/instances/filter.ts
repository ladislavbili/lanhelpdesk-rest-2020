import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface FilterInstance extends DefaultInstance {
  title: string;
  description: string;
  pub: boolean;
  global: boolean;
  dashboard: boolean;
  order: number;
  ofProject: boolean;
  active: boolean;

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

  scheduledFrom: number;
  scheduledFromNow: boolean;
  scheduledTo: number;
  scheduledToNow: boolean;

  createdAtFrom: number;
  createdAtFromNow: boolean;
  createdAtTo: number;
  createdAtToNow: boolean;

  important: boolean;
  invoiced: boolean;
  pausal: boolean;
  overtime: boolean;

  getFilterRequesters?: any;
  getFilterCompanies?: any;
  getFilterTaskTypes?: any;
  getFilterAssignedTos?: any;
  getFilterTags?: any;
  getFilterStatuses?: any;
  getFilterOneOfs?: any;
  getFilterCreatedBy?: any;
  getFilterOfProject?: any;

  setRoles?: any;
  setProjectGroups?: any;
  setFilterAssignedTos?: any;
  setFilterTags?: any;
  setFilterStatuses?: any;
  setFilterRequesters?: any;
  setFilterCompanies?: any;
  setFilterTaskTypes?: any;
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
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ""
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
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      ofProject: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
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
            assignedTos,
            tags,
            statuses,
            requesters,
            companies,
            taskTypes,
            oneOfResponse,
          ] = await Promise.all([
            this.getFilterAssignedTos(),
            this.getFilterTags(),
            this.getFilterStatuses(),
            this.getFilterRequesters(),
            this.getFilterCompanies(),
            this.getFilterTaskTypes(),
            this.getFilterOneOfs(),
          ]);

          return {
            assignedToCur: this.get('assignedToCur'),
            assignedTos,
            tags,
            statuses,
            requesterCur: this.get('requesterCur'),
            requesters,
            companyCur: this.get('companyCur'),
            companies,
            taskTypes,
            important: this.get('important'),
            invoiced: this.get('invoiced'),
            pausal: this.get('pausal'),
            overtime: this.get('overtime'),
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

            scheduledFrom: this.get('scheduledFrom'),
            scheduledFromNow: this.get('scheduledFromNow'),
            scheduledTo: this.get('scheduledTo'),
            scheduledToNow: this.get('scheduledToNow'),

            createdAtFrom: this.get('createdAtFrom'),
            createdAtFromNow: this.get('createdAtFromNow'),
            createdAtTo: this.get('createdAtTo'),
            createdAtToNow: this.get('createdAtToNow'),

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

      scheduledFrom: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      scheduledFromNow: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      scheduledTo: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      scheduledToNow: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      createdAtFrom: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      createdAtFromNow: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAtTo: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      createdAtToNow: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      important: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: null,
      },
      invoiced: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: null,
      },
      pausal: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: null,
      },
      overtime: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: null,
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

  models.Filter.belongsToMany(models.User, { as: { singular: "filterAssignedTo", plural: "filterAssignedTos" }, through: 'filter_assignedTo' });

  models.Filter.belongsToMany(models.Tag, { as: { singular: "filterTag", plural: "filterTags" }, through: 'filter_tags' });

  models.Filter.belongsToMany(models.Status, { as: { singular: "filterStatus", plural: "filterStatuses" }, through: 'filter_statuses' });

  models.Filter.belongsToMany(models.User, { as: { singular: "filterRequester", plural: "filterRequesters" }, through: 'filter_requester' });

  models.Filter.belongsToMany(models.Company, { as: { singular: "filterCompany", plural: "filterCompanies" }, through: 'filter_company' });

  models.Filter.belongsToMany(models.TaskType, { as: { singular: "filterTaskType", plural: "filterTaskTypes" }, through: 'filter_task_type' });

  models.Filter.belongsTo(models.Project, { as: 'filterOfProject' });

  models.Filter.belongsToMany(models.Role, { through: 'filter_access_roles' });

  models.Filter.belongsToMany(models.ProjectGroup, { through: 'filter_groups' });
}
