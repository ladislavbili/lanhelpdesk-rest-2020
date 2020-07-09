import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface RoleInstance extends DefaultInstance {
  title: string;
  order: number;

  getAccessRights?: any;
  setAccessRights?: any;
}

export default function defineRole( sequelize: Sequelize ){
  sequelize.define<RoleInstance>(
    "Role",
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
    },
    {
      //OPTIONS
      tableName: 'roles',
      // freezeTableName: true,
    }
  );
}
