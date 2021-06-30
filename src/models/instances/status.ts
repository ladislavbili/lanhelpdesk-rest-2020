import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface StatusInstance extends DefaultInstance {
  title: string;
  order: number;
  color: string;
  icon: string;
  action: string;
  getTasks?: any;
}

export default function defineStatuses(sequelize: Sequelize) {
  sequelize.define<StatusInstance>(
    "Status",
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
      template: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      color: {
        type: DataTypes.TEXT({ length: "tiny" }),
        allowNull: false,
        defaultValue: "#f759f2"
      },
      icon: {
        type: DataTypes.TEXT({ length: "tiny" }),
        allowNull: false,
        defaultValue: "fa fa-asterisk"
      },
      action: {
        type: DataTypes.TEXT({ length: "tiny" }),
        allowNull: false,
        defaultValue: "None"
      },
    },
    {
      //OPTIONS
      tableName: 'statuses',
      // freezeTableName: true,
    }
  );
}

export function createStatusesAssoc(models) {
  models.Status.belongsToMany(models.User, { through: 'user_set_statuses' });

  models.Status.belongsTo(models.Project, { as: 'projectStatus' });

  models.Status.belongsTo(models.Project, { as: 'defStatus' });

  models.Status.belongsToMany(models.Filter, { as: { singular: "statusFilter", plural: "statusFilters" }, through: 'filter_statuses' });
  models.Status.hasMany(models.Task);
  models.Status.hasMany(models.RepeatTemplate);
}
