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

  setTags?: any;
  setRole?: any;
  getRole?: any;
  setStatuses?: any;
  setCompany?: any;
  createToken?: any;
  setPricelist?: any;

  getRequesterTasks?: any;
  getSubtasks?: any;
  getWorkTrips?: any;
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
      tasklistLayout: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
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

  models.User.hasMany(models.Token);

  models.User.belongsTo(models.Company, { foreignKey: { allowNull: false } });

  models.User.belongsToMany(models.Status, { through: 'user_set_statuses' });

  models.User.hasMany(models.ProjectRight, { onDelete: 'CASCADE' });

  models.User.belongsToMany(models.Project, { as: { singular: "defAssignedTo", plural: "defAssignedTos" }, through: 'project_def_assignedTos' });

  models.User.hasMany(models.Project, { as: 'defRequester' });

  models.User.hasMany(models.ErrorMessage);

  models.User.hasMany(models.UserNotification);

  models.User.hasMany(models.Filter, { as: 'filterCreatedBy' });

  models.User.hasMany(models.Filter, { as: 'filterAssignedTo' });

  models.User.hasMany(models.Filter, { as: 'filterRequester' });

  models.User.belongsToMany(models.Task, { as: { singular: "assignedToTask", plural: "assignedToTasks" }, through: 'task_assignedTo' });

  models.User.hasMany(models.Task, { as: 'createdTask' });

  models.User.hasMany(models.Task, { as: { singular: 'requesterTask', plural: 'requesterTasks' } });

  models.User.hasMany(models.Subtask);

  models.User.hasMany(models.WorkTrip);

  models.User.hasMany(models.Comment, { onDelete: 'CASCADE' });

  models.User.hasMany(models.TaskChange);

  models.User.hasMany(models.TaskAttachment, { onDelete: 'CASCADE' });

  models.User.hasMany(models.InvoicedTrip);

  models.User.hasMany(models.InvoicedSubtask);

  models.User.hasMany(models.InvoicedAssignedTo);
}
