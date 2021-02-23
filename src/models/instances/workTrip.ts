import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface WorkTripInstance extends DefaultInstance {

  order: number;
  done: boolean;
  approved: boolean;
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
      approved: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      discount: {
        type: DataTypes.DECIMAL(10, 2),
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
  models.WorkTrip.belongsTo(models.Task);

  models.WorkTrip.belongsTo(models.RepeatTemplate);

  models.WorkTrip.belongsTo(models.TripType);

  models.WorkTrip.belongsTo(models.User);

  models.WorkTrip.belongsTo(models.User, { as: 'TripApprovedBy' });

  models.WorkTrip.hasMany(models.InvoicedTrip);
}
