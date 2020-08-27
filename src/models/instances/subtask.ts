import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface SubtaskInstance extends DefaultInstance {

  title: string;
  order: number;
  done: boolean;
  quantity: number;
  discount: number;
  //type
  //assignedTo

}

export default function defineSubtasks( sequelize: Sequelize ){
  sequelize.define<SubtaskInstance>(
    "Subtask",
    {
      title: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      done: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      quantity: {
        type: DataTypes.FLOAT(10,2),
        allowNull: false,
        defaultValue: 0
      },
      discount: {
        type: DataTypes.FLOAT(10,2),
        allowNull: false,
        defaultValue: 0
      },
    },
    {
      //OPTIONS
      tableName: 'subtasks',
      // freezeTableName: true,
    }
  );
}
