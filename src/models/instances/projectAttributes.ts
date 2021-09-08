import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface ProjectAttributesInstance extends DefaultInstance {
  statusFixed: boolean;
  tagsFixed: boolean;
  assignedFixed: boolean;
  requesterFixed: boolean;
  companyFixed: boolean;
  taskTypeFixed: boolean;
  //local
  pausalFixed: boolean;
  overtimeFixed: boolean;
  startsAtFixed: boolean;
  deadlineFixed: boolean;
  pausal: boolean;
  overtime: boolean;
  startsAt: boolean;
  deadline: boolean;

  getStatus?: any;
  getTags?: any;
  getAssigned?: any;
  getRequester?: any;
  getCompany?: any;
  getTaskType?: any;

  setAssigned?: any;
  setStatus?: any;
  setTags?: any;
  setDefTaskType?: any;
  setDefRequester?: any;

  removeAssignedOne?: any;
}

export default function defineProjectAttributes(sequelize: Sequelize) {
  sequelize.define<ProjectAttributesInstance>(
    "ProjectAttributes",
    {
      attributes: {
        type: DataTypes.VIRTUAL,
        async get() {
          const [
            status,
            tags,
            assigned,
            requester,
            company,
            taskType
          ] = await Promise.all([
            this.getStatus(),
            this.getTags(),
            this.getAssigned(),
            this.getRequester(),
            this.getCompany(),
            this.getTaskType()
          ]);
          return {
            status: {
              fixed: this.get('statusFixed'),
              value: status
            },
            tags: {
              fixed: this.get('tagsFixed'),
              value: tags
            },
            assigned: {
              fixed: this.get('assignedFixed'),
              value: assigned
            },
            requester: {
              fixed: this.get('requesterFixed'),
              value: requester
            },
            company: {
              fixed: this.get('companyFixed'),
              value: company
            },
            taskType: {
              fixed: this.get('taskTypeFixed'),
              value: taskType
            },
            pausal: {
              fixed: this.get('pausalFixed'),
              value: this.get('pausal'),
            },
            overtime: {
              fixed: this.get('overtimeFixed'),
              value: this.get('overtime'),
            },
            startsAt: {
              fixed: this.get('startsAtFixed'),
              value: this.get('startsAt'),
            },
            deadline: {
              fixed: this.get('deadlineFixed'),
              value: this.get('deadline'),
            },
          }
        }
      },
      statusFixed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      tagsFixed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      assignedFixed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      requesterFixed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      companyFixed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      taskTypeFixed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      pausalFixed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      overtimeFixed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      startsAtFixed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      deadlineFixed: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      pausal: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      overtime: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      startsAt: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      deadline: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      //OPTIONS
      tableName: 'project_attributes',
      // freezeTableName: true,
    }
  );
}


export function createProjectAttributesAssoc(models) {
  models.ProjectAttributes.belongsTo(models.Status);

  models.ProjectAttributes.belongsToMany(models.Tag, { through: 'project_attributes_def_tags' });

  models.ProjectAttributes.belongsToMany(models.User, { as: { singular: "assignedOne", plural: "assigned" }, through: 'project_def_assigned' });

  models.ProjectAttributes.belongsTo(models.User, { as: 'requester' });

  models.ProjectAttributes.belongsTo(models.Company);

  models.ProjectAttributes.belongsTo(models.TaskType);

  models.ProjectAttributes.belongsTo(models.Project);
}
