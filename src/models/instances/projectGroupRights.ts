import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface ProjectGroupRightsInstance extends DefaultInstance {
  assignedRead: Boolean;
  assignedWrite: Boolean;
  companyRead: Boolean;
  companyWrite: Boolean;
  deadlineRead: Boolean;
  deadlineWrite: Boolean;
  milestoneRead: Boolean;
  milestoneWrite: Boolean;
  overtimeRead: Boolean;
  overtimeWrite: Boolean;
  pausalRead: Boolean;
  pausalWrite: Boolean;
  projectRead: Boolean;
  projectWrite: Boolean;
  projectPrimaryRead: Boolean;
  projectPrimaryWrite: Boolean;
  repeatRead: Boolean;
  repeatWrite: Boolean;
  requesterRead: Boolean;
  requesterWrite: Boolean;
  rozpocetRead: Boolean;
  rozpocetWrite: Boolean;
  scheduledRead: Boolean;
  scheduledWrite: Boolean;
  statusRead: Boolean;
  statusWrite: Boolean;
  tagsRead: Boolean;
  tagsWrite: Boolean;
  taskAttachmentsRead: Boolean;
  taskAttachmentsWrite: Boolean;
  taskDescriptionRead: Boolean;
  taskDescriptionWrite: Boolean;
  taskShortSubtasksRead: Boolean;
  taskShortSubtasksWrite: Boolean;
  typeRead: Boolean;
  typeWrite: Boolean;
  vykazRead: Boolean;
  vykazWrite: Boolean;
  addComments: Boolean;
  emails: Boolean;
  history: Boolean;
  internal: Boolean;
  projectSecondary: Boolean;
  pausalInfo: Boolean;
  taskTitleEdit: Boolean;
  viewComments: Boolean;
  companyTasks: Boolean;
  allTasks: Boolean;
  addTasks: Boolean;
  deleteTasks: Boolean;
  important: Boolean;

}

export default function defineProjectGroupRights(sequelize: Sequelize) {
  sequelize.define<ProjectGroupRightsInstance>(
    "ProjectGroupRights",
    {
      assignedRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      assignedWrite: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      companyRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      companyWrite: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      deadlineRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      deadlineWrite: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      milestoneRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      milestoneWrite: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      overtimeRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      overtimeWrite: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      pausalRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      pausalWrite: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
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
      projectPrimaryRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      projectPrimaryWrite: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      repeatRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      repeatWrite: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      requesterRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      requesterWrite: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      rozpocetRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      rozpocetWrite: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      scheduledRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      scheduledWrite: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      statusRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      statusWrite: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      tagsRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      tagsWrite: {
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
      taskShortSubtasksRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      taskShortSubtasksWrite: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      typeRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      typeWrite: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      vykazRead: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      vykazWrite: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      addComments: {
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
      internal: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      projectSecondary: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      pausalInfo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      taskTitleEdit: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      viewComments: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
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
      addTasks: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      deleteTasks: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      important: {
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
