import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface InvoicedTripInstance extends DefaultInstance {
  price: number;
  quantity: number;
  type: string;
  assignedTo: string;
}

export default function defineInvoicedTrips(sequelize: Sequelize) {
  sequelize.define<InvoicedTripInstance>(
    "InvoicedTrip",
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
      tableName: 'invoiced_trip',
      // freezeTableName: true,
    }
  );
}

export function createInvoicedTripsAssoc(models) {
  models.InvoicedTrip.belongsTo(models.WorkTrip);
  models.InvoicedTrip.belongsTo(models.InvoicedTask);
}
