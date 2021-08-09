import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface TasklistGanttColumnPreferenceInstance extends DefaultInstance {
  taskId: boolean;
  status: boolean;
  important: boolean;
  invoiced: boolean;
  requester: boolean;
  company: boolean;
  assignedTo: boolean;
  createdAtV: boolean;
  taskType: boolean;
  overtime: boolean;
  pausal: boolean;
  tags: boolean;
  works: boolean;
  trips: boolean;
  materialsWithoutDPH: boolean;
  materialsWithDPH: boolean;
  subtasks: boolean;
  subtaskAssigned: boolean;
  subtasksHours: boolean;
}

export default function defineTasklistGanttColumnPreferences(sequelize: Sequelize) {
  sequelize.define<TasklistGanttColumnPreferenceInstance>(
    "TasklistGanttColumnPreference",
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
      works: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      trips: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      materialsWithoutDPH: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      materialsWithDPH: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      subtasks: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      subtaskAssigned: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      subtasksHours: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      //OPTIONS
      tableName: 'tasklist_gantt_column_preference',
      // freezeTableName: true,
    }
  );
}

export function createTasklistGanttColumnPreferencesAssoc(models) {
  models.TasklistGanttColumnPreference.belongsTo(models.User, { as: 'User', foreignKey: { allowNull: false } });
  models.TasklistGanttColumnPreference.belongsTo(models.Project, { as: 'Project', foreignKey: { allowNull: true } });
}
