import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface CMDBManualInstance extends DefaultInstance {
  title: string;
  body: string;
}

export default function defineCMDBManuals(sequelize: Sequelize) {
  sequelize.define<CMDBManualInstance>(
    "CMDBManual",
    {
      title: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      body: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ""
      },
    },
    {
      //OPTIONS
      tableName: 'cmdb_manuals',
      // freezeTableName: true,
    }
  );
}

export function createCMDBManualsAssoc(models) {
  models.CMDBManual.belongsTo(models.Company);
  models.CMDBManual.hasMany(models.CMDBFile, { onDelete: 'CASCADE' });
  models.CMDBManual.belongsTo(models.User, { as: 'createdBy' });
  models.CMDBManual.belongsTo(models.User, { as: 'changedBy' });
}
