import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface CompanyDefaultsInstance extends DefaultInstance {
  dph: number;
}

export default function defineCompanyDefaults(sequelize: Sequelize) {
  sequelize.define<CompanyDefaultsInstance>(
    "CompanyDefaults",
    {
      dph: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 20
      },
    },
    {
      //OPTIONS
      tableName: 'company_defaults',
      // freezeTableName: true,
    }
  );
}

export function createCompanyDefaultsAssoc(models) {
}
