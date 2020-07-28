import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface ProjectRightInstance extends DefaultInstance {
  read: boolean;
  write: boolean;
  delete: boolean;
  internal: boolean;
  admin: boolean;
}

export default function defineProjectRights( sequelize: Sequelize ){
  sequelize.define<ProjectRightInstance>(
    "ProjectRight",
    {
      read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      write: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      delete: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      internal: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      admin: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      //OPTIONS
      tableName: 'project_rights',
      // freezeTableName: true,
    }
  );
}
