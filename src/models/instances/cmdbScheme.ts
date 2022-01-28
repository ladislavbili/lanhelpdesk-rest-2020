import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface CMDBSchemeInstance extends DefaultInstance {
  description: string;
}

export default function defineCMDBSchemes(sequelize: Sequelize) {
  sequelize.define<CMDBSchemeInstance>(
    "CMDBScheme",
    {
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      //OPTIONS
      tableName: 'cmdb_schemes',
      // freezeTableName: true,
    }
  );
}

export function createCMDBSchemesAssoc(models) {
  models.CMDBScheme.belongsTo(models.Company);
  models.CMDBScheme.hasOne(models.CMDBFile, { onDelete: 'CASCADE' });
}
