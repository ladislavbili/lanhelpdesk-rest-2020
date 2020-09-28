import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface RoleInstance extends DefaultInstance {
  title: string;
  order: number;
  level: number;

  getAccessRights?: any;
  setAccessRights?: any;
  getUsers?: any;
}

export default function defineRole(sequelize: Sequelize) {
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
      level: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 100
      },
    },
    {
      //OPTIONS
      tableName: 'roles',
      // freezeTableName: true,
    }
  );
}

export function createRolesAssoc(models) {
  models.Role.hasOne(models.AccessRights, { foreignKey: { allowNull: false }, onDelete: 'CASCADE' });

  models.Role.hasMany(models.User);

  models.Role.hasMany(models.Imap, { foreignKey: { allowNull: false } });

  models.Role.belongsToMany(models.Filter, { through: 'filter_access_roles' });
}
