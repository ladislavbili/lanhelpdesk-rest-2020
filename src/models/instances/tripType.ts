import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface TripTypeInstance extends DefaultInstance {
  title: string;
  order: number;
  getWorkTrips?: any;
}

export default function defineTripTypes(sequelize: Sequelize) {
  sequelize.define<TripTypeInstance>(
    "TripType",
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
    },
    {
      //OPTIONS
      tableName: 'trip_types',
      // freezeTableName: true,
    }
  );
}
