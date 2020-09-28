import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface PricelistInstance extends DefaultInstance {
  title: string;
  order: number;
  afterHours: number;
  def: boolean;
  materialMargin: number;
  materialMarginExtra: number;
  createPrice?: any;
}

export default function definePricelists(sequelize: Sequelize) {
  sequelize.define<PricelistInstance>(
    "Pricelist",
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
      afterHours: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      def: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      materialMargin: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      materialMarginExtra: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    },
    {
      //OPTIONS
      tableName: 'pricelists',
      // freezeTableName: true,
    }
  );
}

export function createPricelistsAssoc(models) {
  models.Pricelist.hasMany(models.Price, { onDelete: 'CASCADE' });

  models.Pricelist.hasMany(models.Company);
}
