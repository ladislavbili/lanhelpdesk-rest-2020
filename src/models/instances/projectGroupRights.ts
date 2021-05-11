import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface ProjectGroupRightsInstance extends DefaultInstance {
  assignedRead: boolean;
  assignedWrite: boolean;
  companyRead: boolean;
  companyWrite: boolean;
  deadlineRead: boolean;
  deadlineWrite: boolean;
  milestoneRead: boolean;
  milestoneWrite: boolean;
  overtimeRead: boolean;
  overtimeWrite: boolean;
  pausalRead: boolean;
  pausalWrite: boolean;
  projectRead: boolean;
  projectWrite: boolean;
  projectPrimaryRead: boolean;
  projectPrimaryWrite: boolean;
  repeatRead: boolean;
  repeatWrite: boolean;
  requesterRead: boolean;
  requesterWrite: boolean;
  rozpocetRead: boolean;
  rozpocetWrite: boolean;
  scheduledRead: boolean;
  scheduledWrite: boolean;
  statusRead: boolean;
  statusWrite: boolean;
  tagsRead: boolean;
  tagsWrite: boolean;
  taskAttachmentsRead: boolean;
  taskAttachmentsWrite: boolean;
  taskDescriptionRead: boolean;
  taskDescriptionWrite: boolean;
  taskShortSubtasksRead: boolean;
  taskShortSubtasksWrite: boolean;
  typeRead: boolean;
  typeWrite: boolean;
  vykazRead: boolean;
  vykazWrite: boolean;
  addComments: boolean;
  emails: boolean;
  history: boolean;
  internal: boolean;
  projectSecondary: boolean;
  pausalInfo: boolean;
  taskTitleEdit: boolean;
  viewComments: boolean;
  companyTasks: boolean;
  allTasks: boolean;
  addTasks: boolean;
  deleteTasks: boolean;
  important: boolean;
  statistics: boolean;

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
      statistics: {
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
