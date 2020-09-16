import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface CompanyRentInstance extends DefaultInstance {
  title: string;
  quantity: number;
  cost: number;
  price: number;
  total: number;
}

export default function defineCompanyRents(sequelize: Sequelize) {
  sequelize.define<CompanyRentInstance>(
    "CompanyRent",
    {
      title: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.FLOAT(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      cost: {
        type: DataTypes.FLOAT(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      price: {
        type: DataTypes.FLOAT(10, 2),
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
      tableName: 'company_rents',
      // freezeTableName: true,
    }
  );
}
