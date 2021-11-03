import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface InvoicedTaskTagInstance extends DefaultInstance {
  tagId: number;
  title: string;
  color: string;
  order: string;
}

export default function defineInvoicedTaskTags(sequelize: Sequelize) {
  sequelize.define<InvoicedTaskTagInstance>(
    "InvoicedTaskTag",
    {
      tagId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      title: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      color: {
        type: DataTypes.TEXT({ length: "tiny" }),
        allowNull: false,
        defaultValue: "#f759f2"
      },
      order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
    },
    {
      tableName: 'invoiced_task_tags',
    }
  );
}

export function createInvoicedTaskTagsAssoc(models) {
  models.InvoicedTaskTag.belongsTo(models.InvoicedTask, { foreignKey: { allowNull: false } });
}
