import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface MaterialInstance extends DefaultInstance {
  title: string;
  order: number;
  done: boolean;
  approved: boolean;
  quantity: number;
  margin: number;
  price: number;
}

export default function defineMaterials(sequelize: Sequelize) {
  sequelize.define<MaterialInstance>(
    "Material",
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
    },
    {
      //OPTIONS
      tableName: 'materials',
      // freezeTableName: true,
    }
  );
}

export function createMaterialsAssoc(models) {
  models.Material.belongsTo(models.Task);

  models.Material.belongsTo(models.User, { as: 'MaterialApprovedBy' });

  models.Material.belongsTo(models.RepeatTemplate);

  models.Material.hasMany(models.InvoicedMaterial);
}
