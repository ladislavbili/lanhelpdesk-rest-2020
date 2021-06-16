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
  scheduled: boolean;
  createdAtV: boolean;
  startsAt: boolean;
  deadline: boolean;
  project: boolean;
  milestone: boolean;
  taskType: boolean;
  overtime: boolean;
  pausal: boolean;
  tags: boolean;
  statistics: boolean;
  works: boolean;
  trips: boolean;
  materialsWithoutDPH: boolean;
  materialsWithDPH: boolean;
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
      scheduled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      createdAtV: {
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
      statistics: {
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
