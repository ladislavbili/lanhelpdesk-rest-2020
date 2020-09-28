import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface PriceInstance extends DefaultInstance {
  price: number;
  type: string;
}

export default function definePrices(sequelize: Sequelize) {
  sequelize.define<PriceInstance>(
    "Price",
    {
      price: {
        type: DataTypes.FLOAT(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      type: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      //OPTIONS
      tableName: 'prices',
      // freezeTableName: true,
    }
  );
}

export function createPricesAssoc(models) {
  models.Price.belongsTo(models.Pricelist, { foreignKey: { allowNull: false } });

  models.Price.belongsTo(models.TripType);

  models.Price.belongsTo(models.TaskType);
}
