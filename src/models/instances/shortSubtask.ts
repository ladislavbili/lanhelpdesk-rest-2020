import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface ShortSubtaskInstance extends DefaultInstance {
  title: string;
  done: boolean;
}

export default function defineShortSubtasks(sequelize: Sequelize) {
  sequelize.define<ShortSubtaskInstance>(
    "ShortSubtask",
    {
      title: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      done: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      //OPTIONS
      tableName: 'short_subtasks',
      // freezeTableName: true,
    }
  );
}

export function createShortSubtasksAssoc(models) {
  models.ShortSubtask.belongsTo(models.Task);
  models.ShortSubtask.belongsTo(models.RepeatTemplate);
}
