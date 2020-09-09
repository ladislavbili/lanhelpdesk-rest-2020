import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface CustomItemInstance extends DefaultInstance {
  title: string;
  order: number;
  done: boolean;
  quantity: number;
  price: number;
}



export default function defineCustomItems( sequelize: Sequelize ){
  sequelize.define<CustomItemInstance>(
    "CustomItem",
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
      done: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      quantity: {
        type: DataTypes.FLOAT(10,2),
        allowNull: false,
        defaultValue: 0
      },
      price: {
        type: DataTypes.FLOAT(10,2),
        allowNull: false,
        defaultValue: 0
      },
    },
    {
      //OPTIONS
      tableName: 'custom_items',
      // freezeTableName: true,
    }
  );
}