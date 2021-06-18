import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface TasklistSortInstance extends DefaultInstance {
  layout: number;
  sort: string;
  asc: boolean;
}

export default function defineTasklistSorts(sequelize: Sequelize) {
  sequelize.define<TasklistSortInstance>(
    "TasklistSort",
    {
      layout: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      sort: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      asc: {
        type: DataTypes.BOOLEAN,
        allowNull: false
      },
    },
    {
      //OPTIONS
      tableName: 'tasklist_sort',
      // freezeTableName: true,
    }
  );
}

export function createTasklistSortsAssoc(models) {
  models.TasklistSort.belongsTo(models.User);
}
