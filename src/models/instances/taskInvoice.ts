import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

const stringToListOfIntegers = (stringForm) => {
  if (stringForm === '') {
    return []
  }
  return stringForm.split(',').map((val) => parseInt(val))
}

export interface TaskInvoiceInstance extends DefaultInstance {
  title: string;
  fromDate: number;
  toDate: number;
  //company
  //companyRentsCounts -g
  CRCRentTotalWithoutDPH: number;
  CRCRentTotalWithDPH: number;

  //pausalCounts -g
  PCSubtasks: number;
  PCSubtasksAfterHours: number;
  PCSubtasksAfterHoursTaskIds: string;
  PCSubtasksAfterHoursPrice: number;
  PCTrips: number;
  PCTripsAfterHours: number;
  PCTripsAfterHoursTaskIds: string;
  PCTripsAfterHoursPrice: number;

  //overPausalCounts -g
  OPCSubtasks: number;
  OPCSubtasksAfterHours: number;
  OPCSubtasksAfterHoursTaskIds: string;
  OPCSubtasksAfterHoursPrice: number;
  OPCSubtasksTotalPriceWithoutDPH: number;
  OPCSubtasksTotalPriceWithDPH: number;

  OPCTrips: number;
  OPCTripsAfterHours: number;
  OPCTripsAfterHoursTaskIds: string;
  OPCTripsAfterHoursPrice: number;
  OPCTripsTotalPriceWithoutDPH: number;
  OPCTripsTotalPriceWithDPH: number;

  //projectCounts -g
  PRCSubtasks: number;
  PRCSubtasksAfterHours: number;
  PRCSubtasksAfterHoursTaskIds: string;
  PRCSubtasksAfterHoursPrice: number;
  PRCSubtasksTotalPriceWithoutDPH: number;
  PRCSubtasksTotalPriceWithDPH: number;

  PRCTrips: number;
  PRCTripsAfterHours: number;
  PRCTripsAfterHoursTaskIds: string;
  PRCTripsAfterHoursPrice: number;
  PRCTripsTotalPriceWithoutDPH: number;
  PRCTripsTotalPriceWithDPH: number;

  //pausalTasks
  //overPausalTasks
  //projectTasks
  // tasks for materials and customItems
  totalMaterialAndCustomItemPriceWithoutDPH: number;
  totalMaterialAndCustomItemPriceWithDPH: number;

  setTasks?: any;
}

export default function defineTaskInvoices(sequelize: Sequelize) {
  sequelize.define<TaskInvoiceInstance>(
    "TaskInvoice",
    {
      title: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      fromDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      toDate: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      CRCRentTotalWithoutDPH: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      CRCRentTotalWithDPH: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      PCSubtasks: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      PCSubtasksAfterHours: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      PCSubtasksAfterHoursTaskIds: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      PCSubtasksAfterHoursPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      PCTrips: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      PCTripsAfterHours: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      PCTripsAfterHoursTaskIds: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      PCTripsAfterHoursPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      OPCSubtasks: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      OPCSubtasksAfterHours: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      OPCSubtasksAfterHoursTaskIds: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      OPCSubtasksAfterHoursPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      OPCSubtasksTotalPriceWithoutDPH: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      OPCSubtasksTotalPriceWithDPH: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      OPCTrips: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      OPCTripsAfterHours: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      OPCTripsAfterHoursTaskIds: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      OPCTripsAfterHoursPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      OPCTripsTotalPriceWithoutDPH: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      OPCTripsTotalPriceWithDPH: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },

      PRCSubtasks: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      PRCSubtasksAfterHours: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      PRCSubtasksAfterHoursTaskIds: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      PRCSubtasksAfterHoursPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      PRCSubtasksTotalPriceWithoutDPH: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      PRCSubtasksTotalPriceWithDPH: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      PRCTrips: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      PRCTripsAfterHours: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      PRCTripsAfterHoursTaskIds: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      PRCTripsAfterHoursPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      PRCTripsTotalPriceWithoutDPH: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      PRCTripsTotalPriceWithDPH: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },

      totalMaterialAndCustomItemPriceWithoutDPH: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      totalMaterialAndCustomItemPriceWithDPH: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      companyRentsCounts: {
        type: DataTypes.VIRTUAL,
        async get() {
          return {
            totalWithoutDPH: this.get('CRCRentTotalWithoutDPH'),
            totalWithDPH: this.get('CRCRentTotalWithDPH'),
          }
        }
      },
      pausalCounts: {
        type: DataTypes.VIRTUAL,
        async get() {
          return {
            subtasks: this.get('PCSubtasks'),
            subtasksAfterHours: this.get('PCSubtasksAfterHours'),
            subtasksAfterHoursTaskIds: stringToListOfIntegers(this.get('PCSubtasksAfterHoursTaskIds')),
            subtasksAfterHoursPrice: this.get('PCSubtasksAfterHoursPrice'),
            trips: this.get('PCTrips'),
            tripsAfterHours: this.get('PCTripsAfterHours'),
            tripsAfterHoursTaskIds: stringToListOfIntegers(this.get('PCTripsAfterHoursTaskIds')),
            tripsAfterHoursPrice: this.get('PCTripsAfterHoursPrice'),
          }
        }
      },
      overPausalCounts: {
        type: DataTypes.VIRTUAL,
        async get() {
          return {
            subtasks: this.get('OPCSubtasks'),
            subtasksAfterHours: this.get('OPCSubtasksAfterHours'),
            subtasksAfterHoursTaskIds: stringToListOfIntegers(this.get('OPCSubtasksAfterHoursTaskIds')),
            subtasksAfterHoursPrice: this.get('OPCSubtasksAfterHoursPrice'),
            subtasksTotalPriceWithoutDPH: this.get('OPCSubtasksTotalPriceWithoutDPH'),
            subtasksTotalPriceWithDPH: this.get('OPCSubtasksTotalPriceWithDPH'),
            trips: this.get('OPCTrips'),
            tripsAfterHours: this.get('OPCTripsAfterHours'),
            tripsAfterHoursTaskIds: stringToListOfIntegers(this.get('OPCTripsAfterHoursTaskIds')),
            tripsAfterHoursPrice: this.get('OPCTripsAfterHoursPrice'),
            tripsTotalPriceWithoutDPH: this.get('OPCTripsTotalPriceWithoutDPH'),
            tripsTotalPriceWithDPH: this.get('OPCTripsTotalPriceWithDPH'),
          }
        }
      },
      projectCounts: {
        type: DataTypes.VIRTUAL,
        async get() {
          return {
            subtasks: this.get('PRCSubtasks'),
            subtasksAfterHours: this.get('PRCSubtasksAfterHours'),
            subtasksAfterHoursTaskIds: stringToListOfIntegers(this.get('PRCSubtasksAfterHoursTaskIds')),
            subtasksAfterHoursPrice: this.get('PRCSubtasksAfterHoursPrice'),
            subtasksTotalPriceWithoutDPH: this.get('PRCSubtasksTotalPriceWithoutDPH'),
            subtasksTotalPriceWithDPH: this.get('PRCSubtasksTotalPriceWithDPH'),
            trips: this.get('PRCTrips'),
            tripsAfterHours: this.get('PRCTripsAfterHours'),
            tripsAfterHoursTaskIds: stringToListOfIntegers(this.get('PRCTripsAfterHoursTaskIds')),
            tripsAfterHoursPrice: this.get('PRCTripsAfterHoursPrice'),
            tripsTotalPriceWithoutDPH: this.get('PRCTripsTotalPriceWithoutDPH'),
            tripsTotalPriceWithDPH: this.get('PRCTripsTotalPriceWithDPH'),
          }
        }
      },
    },
    {
      //OPTIONS
      tableName: 'task_invoice',
      // freezeTableName: true,
    }
  );
}

export function createTaskInvoicesAssoc(models) {

  models.TaskInvoice.belongsTo(models.Company);
  models.TaskInvoice.hasOne(models.InvoicedCompany, { onDelete: 'CASCADE' });
  models.TaskInvoice.hasMany(models.InvoicedMaterialTask, { as: { singular: 'materialTask', plural: 'materialTasks' }, onDelete: 'CASCADE' });
  models.TaskInvoice.hasMany(models.InvoicedTask, { onDelete: 'CASCADE' });
}
