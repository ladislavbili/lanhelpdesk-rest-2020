import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface StatusInstance extends DefaultInstance {
  title: string;
  order: number;
  color: string;
  icon: string;
  action: string;
}

export default function defineStatuses( sequelize: Sequelize ){
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
