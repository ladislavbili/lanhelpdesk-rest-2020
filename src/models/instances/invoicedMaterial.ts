import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface InvoicedMaterialInstance extends DefaultInstance {
  title: string;
  quantity: number;
  margin: number;
  price: number;
  totalPrice: number;
}

export default function defineInvoicedMaterials(sequelize: Sequelize) {
  sequelize.define<InvoicedMaterialInstance>(
    "InvoicedMaterial",
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
      margin: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      totalPrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
    },
    {
      //OPTIONS
      tableName: 'invoiced_material',
      // freezeTableName: true,
    }
  );
}

export function createInvoicedMaterialsAssoc(models) {
  models.InvoicedMaterial.belongsTo(models.Material);
  models.InvoicedMaterial.belongsTo(models.InvoicedMaterialTask);
}
