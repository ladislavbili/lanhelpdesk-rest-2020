import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface InvoicedCompanyInstance extends DefaultInstance {
  title: string;
  dph: number;
  monthlyPausal: number;
  taskTripPausal: number;
  taskWorkPausal: number;
}

export default function defineInvoicedCompanies(sequelize: Sequelize) {
  sequelize.define<InvoicedCompanyInstance>(
    "InvoicedCompany",
    {
      title: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      dph: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      monthlyPausal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      taskTripPausal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      taskWorkPausal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
    },
    {
      //OPTIONS
      tableName: 'invoiced_company',
      // freezeTableName: true,
    }
  );
}

export function createInvoicedCompaniesAssoc(models) {
  models.InvoicedCompany.belongsTo(models.TaskInvoice);
}
