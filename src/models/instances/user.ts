import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';
import { randomString } from '@/helperFunctions';

export interface UserInstance extends DefaultInstance {
  active: boolean;
  username: string;
  email: string;
  name: string;
  surname: string;
  password: string;
  receiveNotifications: boolean;
  signature: string;
  tokenKey: string;

  language: string;
  tasklistLayout: number;
  taskLayout: number;
  afterTaskCreate: number;

  createToken?: any;
  createTasklistSort?: any;

  setTags?: any;
  setRole?: any;
  setStatuses?: any;
  setCompany?: any;
  setPricelist?: any;

  getRole?: any;
  getRequesterTasks?: any;
  getSubtasks?: any;
  getWorkTrips?: any;
  getProjectGroups?: any;
}

export default function defineUsers(sequelize: Sequelize) {
  sequelize.define<UserInstance>(
    "User",
    {
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      username: {
        type: DataTypes.TEXT({ length: "tiny" }),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING({ length: 200 }),
        allowNull: false,
        validate: {
          isEmail: true
        }
      },
      name: {
        type: DataTypes.TEXT({ length: "tiny" }),
        allowNull: false,
      },
      surname: {
        type: DataTypes.TEXT({ length: "tiny" }),
        allowNull: false,
      },
      fullName: {
        type: DataTypes.VIRTUAL,
        get() {
          return `${this.get('name')} ${this.get('surname')}`
        }
      },
      password: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      receiveNotifications: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      signature: {
        type: DataTypes.STRING({ length: 2000 }),
        allowNull: false,
        defaultValue: "",
      },
      tokenKey: {
        type: DataTypes.TEXT({ length: "tiny" }),
        allowNull: false,
        defaultValue: randomString(),
      },
      language: {
        type: DataTypes.TEXT({ length: "tiny" }),
        allowNull: false,
        defaultValue: 'sk',
      },
      afterTaskCreate: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      tasklistLayout: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      taskLayout: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1
      },
    },
    {
      indexes: [
        {
          unique: true,
          fields: ['email']
        }
      ],
      //OPTIONS
      tableName: 'users',
      // freezeTableName: true,
    }
  );
}

export function createUsersAssoc(models) {
  models.User.belongsTo(models.Role, { foreignKey: { allowNull: false } });

  models.User.hasMany(models.Token, { onDelete: 'CASCADE' });

  models.User.belongsTo(models.Company, { foreignKey: { allowNull: false } });

  models.User.belongsToMany(models.Status, { through: 'user_set_statuses' });

  models.User.belongsToMany(models.ProjectAttributes, { as: { singular: "defAssignedOne", plural: "defAssigned" }, through: 'project_def_assigned' });

  models.User.hasMany(models.ProjectAttributes, { as: 'defRequester' });

  models.User.hasMany(models.ErrorMessage);

  models.User.hasMany(models.UserNotification, { onDelete: 'CASCADE' });

  //FILTER
  models.User.hasMany(models.Filter, { as: 'filterCreatedBy' });

  models.User.belongsToMany(models.Filter, { as: { singular: "filterAssignedTo", plural: "filterAssignedTos" }, through: 'filter_assignedTo' });

  models.User.belongsToMany(models.Filter, { as: { singular: "filterRequester", plural: "filterRequesters" }, through: 'filter_requester' });

  //TASK
  models.User.belongsToMany(models.Task, { as: { singular: "assignedToTask", plural: "assignedToTasks" }, through: 'task_assignedTo' });

  models.User.hasMany(models.Task, { as: 'createdTask' });

  models.User.hasMany(models.Task, { as: { singular: 'requesterTask', plural: 'requesterTasks' } });

  models.User.hasMany(models.TasklistColumnPreference, { onDelete: 'CASCADE', as: { singular: "TasklistColumnPreference", plural: "TasklistColumnPreferences" }, foreignKey: { name: 'UserId', allowNull: false } });

  models.User.hasMany(models.TasklistGanttColumnPreference, { onDelete: 'CASCADE', as: { singular: "TasklistGanttColumnPreference", plural: "TasklistGanttColumnPreferences" }, foreignKey: { name: 'UserId', allowNull: false } });

  models.User.hasMany(models.TasklistSort, { onDelete: 'CASCADE' });

  //REPEAT TEMPLATE
  models.User.belongsToMany(models.RepeatTemplate, { as: { singular: "assignedToRepeatTemplate", plural: "assignedToRepeatTemplates" }, through: 'repeat_template_assignedTo' });

  models.User.hasMany(models.RepeatTemplate, { as: 'createdRepeatTemplate' });

  models.User.hasMany(models.RepeatTemplate, { as: { singular: 'requesterRepeatTemplate', plural: 'requesterRepeatTemplates' } });

  //TASK ATTRIBUTES
  models.User.hasMany(models.Subtask);

  models.User.hasMany(models.WorkTrip);

  models.User.hasMany(models.Subtask, { as: 'SubtaskApprovedBy' });

  models.User.hasMany(models.WorkTrip, { as: 'TripApprovedBy' });

  models.User.hasMany(models.Material, { as: 'MaterialApprovedBy' });

  models.User.hasMany(models.Comment, { onDelete: 'CASCADE' });

  models.User.hasMany(models.TaskChange);

  models.User.hasMany(models.TaskAttachment, { onDelete: 'CASCADE' });

  models.User.belongsToMany(models.ProjectGroup, { through: 'user_belongs_to_group' });

  //LanWiki
  models.User.hasMany(models.LanwikiFolderRight, { as: { singular: "hasLanwikiFolderRight", plural: "hasLanwikiFolderRights" }, onDelete: 'CASCADE' });

  models.User.hasMany(models.LanwikiPage, { as: 'createdLanwikiPage' });
  models.User.hasMany(models.LanwikiPage, { as: 'updatedLanwikiPage' });
}
