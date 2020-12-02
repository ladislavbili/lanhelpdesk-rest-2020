import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface InvoicedMaterialTaskInstance extends DefaultInstance {
  //task
  //InvoicedMaterial
  //InvoicedCustomItem
}

export default function defineInvoicedMaterialTasks(sequelize: Sequelize) {
  sequelize.define<InvoicedMaterialTaskInstance>(
    "InvoicedMaterialTask",
    {
    },
    {
      //OPTIONS
      tableName: 'invoiced_material_task',
      // freezeTableName: true,
    }
  );
}

export function createInvoicedMaterialTasksAssoc(models) {
  models.InvoicedMaterialTask.belongsTo(models.TaskInvoice);
  models.InvoicedMaterialTask.belongsTo(models.Task);
  models.InvoicedMaterialTask.hasMany(models.InvoicedMaterial, { as: { singular: 'material', plural: 'materials' }, onDelete: 'CASCADE' });
  models.InvoicedMaterialTask.hasMany(models.InvoicedCustomItem, { as: { singular: 'customItem', plural: 'customItems' }, onDelete: 'CASCADE' });
}
