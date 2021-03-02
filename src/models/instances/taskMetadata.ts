import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface TaskMetadataInstance extends DefaultInstance {
  subtasksApproved: number;
  subtasksPending: number;
  tripsApproved: number;
  tripsPending: number;
  materialsApproved: number;
  materialsPending: number;
  itemsApproved: number;
  itemsPending: number;
}

export default function defineTaskMetadata(sequelize: Sequelize) {
  sequelize.define<TaskMetadataInstance>(
    "TaskMetadata",
    {
      subtasksApproved: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      subtasksPending: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      tripsApproved: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      tripsPending: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      materialsApproved: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      materialsPending: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      itemsApproved: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      itemsPending: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
    },
    {
      //OPTIONS
      tableName: 'task_metadata',
      // freezeTableName: true,
    }
  );
}

export function createTaskMetadataAssoc(models) {
  models.TaskMetadata.belongsTo(models.Task, { as: 'Task', foreignKey: { allowNull: false } });
}
