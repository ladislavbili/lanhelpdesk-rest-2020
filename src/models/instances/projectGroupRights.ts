import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface ProjectGroupRightsInstance extends DefaultInstance {
  //project
  projectRead: boolean;
  projectWrite: boolean;

  //tasklist
  companyTasks: boolean;
  allTasks: boolean;

  //tasklist view
  tasklistDnD: boolean;
  tasklistKalendar: boolean;
  tasklistGantt: boolean;
  tasklistStatistics: boolean;

  //add task
  addTask: boolean;

  //edit task
  deleteTask: boolean;
  taskImportant: boolean;
  taskTitleWrite: boolean;
  taskProjectWrite: boolean;
  taskDescriptionRead: boolean;
  taskDescriptionWrite: boolean;
  taskAttachmentsRead: boolean;
  taskAttachmentsWrite: boolean;

  taskSubtasksRead: boolean;
  taskSubtasksWrite: boolean;
  taskWorksRead: boolean;
  taskWorksWrite: boolean;
  taskWorksAdvancedRead: boolean;
  taskWorksAdvancedWrite: boolean;
  taskMaterialsRead: boolean;
  taskMaterialsWrite: boolean;
  taskPausalInfo: boolean;

  //comments and history
  viewComments: boolean;
  addComments: boolean;
  internal: boolean;
  emails: boolean;
  history: boolean;

  //attributes

  statusRequired: boolean;
  statusAdd: boolean;
  statusView: boolean;
  statusEdit: boolean;

  tagsRequired: boolean;
  tagsAdd: boolean;
  tagsView: boolean;
  tagsEdit: boolean;

  assignedRequired: boolean;
  assignedAdd: boolean;
  assignedView: boolean;
  assignedEdit: boolean;

  requesterRequired: boolean;
  requesterAdd: boolean;
  requesterView: boolean;
  requesterEdit: boolean;

  companyRequired: boolean;
  companyAdd: boolean;
  companyView: boolean;
  companyEdit: boolean;

  taskTypeRequired: boolean;
  taskTypeAdd: boolean;
  taskTypeView: boolean;
  taskTypeEdit: boolean;


  pausalRequired: boolean;
  pausalAdd: boolean;
  pausalView: boolean;
  pausalEdit: boolean;

  overtimeRequired: boolean;
  overtimeAdd: boolean;
  overtimeView: boolean;
  overtimeEdit: boolean;

  startsAtRequired: boolean;
  startsAtAdd: boolean;
  startsAtView: boolean;
  startsAtEdit: boolean;

  deadlineRequired: boolean;
  deadlineAdd: boolean;
  deadlineView: boolean;
  deadlineEdit: boolean;

  repeatAdd: boolean;
  repeatView: boolean;
  repeatEdit: boolean;
}

export default function defineProjectGroupRights(sequelize: Sequelize) {
  sequelize.define<ProjectGroupRightsInstance>(
    "ProjectGroupRights",
    {
      //project
      projectRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      projectWrite: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      //tasklist
      companyTasks: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      allTasks: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      //tasklist view
      tasklistDnD: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      tasklistKalendar: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      tasklistGantt: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      tasklistStatistics: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      //add task
      addTask: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      //edit task
      deleteTask: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      taskImportant: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      taskTitleWrite: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      taskProjectWrite: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      taskDescriptionRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      taskDescriptionWrite: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      taskAttachmentsRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      taskAttachmentsWrite: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      taskSubtasksRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      taskSubtasksWrite: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      taskWorksRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      taskWorksWrite: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      taskWorksAdvancedRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      taskWorksAdvancedWrite: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      taskMaterialsRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      taskMaterialsWrite: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      taskPausalInfo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      //comments and history
      viewComments: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      addComments: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      internal: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      emails: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      history: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      attributes: {
        type: DataTypes.VIRTUAL,
        get() {
          return ({
            status: {
              required: this.get('statusRequired'),
              add: this.get('statusAdd'),
              view: this.get('statusView'),
              edit: this.get('statusEdit'),
            },
            tags: {
              required: this.get('tagsRequired'),
              add: this.get('tagsAdd'),
              view: this.get('tagsView'),
              edit: this.get('tagsEdit'),
            },
            assigned: {
              required: this.get('assignedRequired'),
              add: this.get('assignedAdd'),
              view: this.get('assignedView'),
              edit: this.get('assignedEdit'),
            },
            requester: {
              required: this.get('requesterRequired'),
              add: this.get('requesterAdd'),
              view: this.get('requesterView'),
              edit: this.get('requesterEdit'),
            },
            company: {
              required: this.get('companyRequired'),
              add: this.get('companyAdd'),
              view: this.get('companyView'),
              edit: this.get('companyEdit'),
            },
            taskType: {
              required: this.get('taskTypeRequired'),
              add: this.get('taskTypeAdd'),
              view: this.get('taskTypeView'),
              edit: this.get('taskTypeEdit'),
            },
            pausal: {
              required: this.get('pausalRequired'),
              add: this.get('pausalAdd'),
              view: this.get('pausalView'),
              edit: this.get('pausalEdit'),
            },
            overtime: {
              required: this.get('overtimeRequired'),
              add: this.get('overtimeAdd'),
              view: this.get('overtimeView'),
              edit: this.get('overtimeEdit'),
            },
            startsAt: {
              required: this.get('startsAtRequired'),
              add: this.get('startsAtAdd'),
              view: this.get('startsAtView'),
              edit: this.get('startsAtEdit'),
            },
            deadline: {
              required: this.get('deadlineRequired'),
              add: this.get('deadlineAdd'),
              view: this.get('deadlineView'),
              edit: this.get('deadlineEdit'),
            },
            repeat: {
              add: this.get('repeatAdd'),
              view: this.get('repeatView'),
              edit: this.get('repeatEdit'),
            },
          });
        },
      },

      //attributes
      statusRequired: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      statusAdd: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      statusView: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      statusEdit: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      tagsRequired: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      tagsAdd: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      tagsView: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      tagsEdit: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      assignedRequired: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      assignedAdd: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      assignedView: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      assignedEdit: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      requesterRequired: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      requesterAdd: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      requesterView: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      requesterEdit: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      companyRequired: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      companyAdd: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      companyView: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      companyEdit: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      taskTypeRequired: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      taskTypeAdd: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      taskTypeView: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      taskTypeEdit: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      pausalRequired: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      pausalAdd: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      pausalView: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      pausalEdit: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      overtimeRequired: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      overtimeAdd: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      overtimeView: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      overtimeEdit: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      startsAtRequired: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      startsAtAdd: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      startsAtView: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      startsAtEdit: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      deadlineRequired: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      deadlineAdd: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      deadlineView: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      deadlineEdit: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      repeatAdd: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      repeatView: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      repeatEdit: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      //OPTIONS
      tableName: 'project_group_rights',
      // freezeTableName: true,
    }
  );
}

export function createProjectGroupRightsAssoc(models) {
  models.ProjectGroupRights.belongsTo(models.ProjectGroup);
}
