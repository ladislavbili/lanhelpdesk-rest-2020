import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface InvoicedTagInstance extends DefaultInstance {
  title: string;
  color: string;
}

export default function defineInvoicedTags(sequelize: Sequelize) {
  sequelize.define<InvoicedTagInstance>(
    "InvoicedTag",
    {
      title: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      color: {
        type: DataTypes.TEXT({ length: "tiny" }),
        allowNull: false,
        defaultValue: "#f759f2"
      },
    },
    {
      //OPTIONS
      tableName: 'invoiced_tags',
      // freezeTableName: true,
    }
  );
}

export function createInvoicedTagsAssoc(models) {
  models.InvoicedTag.belongsTo(models.Tag);
  models.InvoicedTag.belongsTo(models.InvoicedTask);
}
