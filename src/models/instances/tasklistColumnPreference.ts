import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface TasklistColumnPreferenceInstance extends DefaultInstance {
  taskId: boolean;
  status: boolean;
  important: boolean;
  invoiced: boolean;
  title: boolean;
  requester: boolean;
  company: boolean;
  assignedTo: boolean;
  createdAtV: boolean;
  deadline: boolean;
  project: boolean;
  milestone: boolean;
  taskType: boolean;
  overtime: boolean;
  pausal: boolean;
  tags: boolean;
  subtasksApproved: boolean;
  subtasksPending: boolean;
  tripsApproved: boolean;
  tripsPending: boolean;
  materialsApproved: boolean;
  materialsPending: boolean;
  itemsApproved: boolean;
  itemsPending: boolean;
}

export default function defineTasklistColumnPreferences(sequelize: Sequelize) {
  sequelize.define<TasklistColumnPreferenceInstance>(
    "TasklistColumnPreference",
    {
      taskId: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      status: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      important: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      invoiced: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      title: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      requester: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      company: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      assignedTo: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      createdAtV: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      deadline: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      project: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      milestone: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      taskType: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      overtime: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      pausal: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      tags: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      subtasksApproved: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      subtasksPending: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      tripsApproved: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      tripsPending: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      materialsApproved: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      materialsPending: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      itemsApproved: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      itemsPending: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      //OPTIONS
      tableName: 'tasklist_column_preference',
      // freezeTableName: true,
    }
  );
}

export function createTasklistColumnPreferencesAssoc(models) {
  models.TasklistColumnPreference.belongsTo(models.User, { as: 'User', foreignKey: { allowNull: false } });
  models.TasklistColumnPreference.belongsTo(models.Project, { as: 'Project', foreignKey: { allowNull: true } });
}
