import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface InvoicedCompanyRentInstance extends DefaultInstance {
  title: string;
  quantity: number;
  cost: number;
  price: number;
  total: number;
}

export default function defineInvoicedCompanyRents(sequelize: Sequelize) {
  sequelize.define<InvoicedCompanyRentInstance>(
    "InvoicedCompanyRent",
    {
      title: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      cost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      total: {
        type: DataTypes.VIRTUAL,
        get() {
          return this.get('quantity') * this.get('price')
        }
      },
    },
    {
      //OPTIONS
      tableName: 'invoiced_company_rents',
      // freezeTableName: true,
    }
  );
}

export function createInvoicedCompanyRentsAssoc(models) {
  models.InvoicedCompanyRent.belongsTo(models.InvoicedCompany);
}
