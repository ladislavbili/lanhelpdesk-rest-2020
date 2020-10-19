import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface InvoicedSubtaskInstance extends DefaultInstance {
  price: number;
  quantity: number;
  type: string;
  assignedTo: string;
}

export default function defineInvoicedSubtasks(sequelize: Sequelize) {
  sequelize.define<InvoicedSubtaskInstance>(
    "InvoicedSubtask",
    {
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      type: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      assignedTo: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      //OPTIONS
      tableName: 'invoiced_subtask',
      // freezeTableName: true,
    }
  );
}

export function createInvoicedSubtasksAssoc(models) {
  models.InvoicedSubtask.belongsTo(models.Subtask);
  models.InvoicedSubtask.belongsTo(models.InvoicedTask);
}
