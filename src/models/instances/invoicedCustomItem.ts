import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface InvoicedCustomItemInstance extends DefaultInstance {
  title: string;
  quantity: number;
  price: number;
  totalPrice: number;
}

export default function defineInvoicedCustomItems(sequelize: Sequelize) {
  sequelize.define<InvoicedCustomItemInstance>(
    "InvoicedCustomItem",
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
      tableName: 'invoiced_custom_item',
      // freezeTableName: true,
    }
  );
}

export function createInvoicedCustomItemsAssoc(models) {
  models.InvoicedCustomItem.belongsTo(models.CustomItem);
  models.InvoicedCustomItem.belongsTo(models.InvoicedMaterialTask);
}
