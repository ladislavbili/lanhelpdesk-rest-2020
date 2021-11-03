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

  invoiced: boolean;
  invoicedPrice: number;
  invoicedPausalQuantity: number;
  invoicedOverPausalQuantity: number;
  invoicedProjectQuantity: number;
  invoicedTypeId: number;
  invoicedTypeTitle: string;

  setTripType?: any;

  setUser?: any;
  createScheduledWork?: any;

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
      invoiced: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      invoicedPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      invoicedPausalQuantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      invoicedOverPausalQuantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      invoicedProjectQuantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      invoicedTypeId: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      invoicedTypeTitle: {
        type: DataTypes.TEXT,
        allowNull: true,
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

  models.WorkTrip.hasOne(models.ScheduledWork, { onDelete: 'CASCADE' });

  models.WorkTrip.hasOne(models.InvoicedTaskUser, { onDelete: 'CASCADE' });
}
