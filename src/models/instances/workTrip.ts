import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface WorkTripInstance extends DefaultInstance {

  order: number;
  done: boolean;
  quantity: number;
  discount: number;
  //task
  //type
  //assignedTo
  setTripType?: any;
  setUser?: any;


}

export default function defineWorkTrips(sequelize: Sequelize) {
  sequelize.define<WorkTripInstance>(
    "WorkTrip",
    {
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
        type: DataTypes.FLOAT(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      discount: {
        type: DataTypes.FLOAT(10, 2),
        allowNull: false,
        defaultValue: 0
      },
    },
    {
      //OPTIONS
      tableName: 'work_trips',
      // freezeTableName: true,
    }
  );
}

export function createWorkTripsAssoc(models) {
  models.WorkTrip.belongsTo(models.Task, { foreignKey: { allowNull: false } });

  models.WorkTrip.belongsTo(models.TripType);

  models.WorkTrip.belongsTo(models.User);
}
