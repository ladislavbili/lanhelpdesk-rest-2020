import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface InvoicedAssignedToInstance extends DefaultInstance {
  title: string;
}

export default function defineInvoicedAssignedTos(sequelize: Sequelize) {
  sequelize.define<InvoicedAssignedToInstance>(
    "InvoicedAssignedTo",
    {
      title: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      //OPTIONS
      tableName: 'invoiced_assignedTos',
      // freezeTableName: true,
    }
  );
}

export function createInvoicedAssignedTosAssoc(models) {
  models.InvoicedAssignedTo.belongsTo(models.User);
  models.InvoicedAssignedTo.belongsTo(models.InvoicedTask);
}
