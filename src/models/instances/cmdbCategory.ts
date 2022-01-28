import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface CMDBCategoryInstance extends DefaultInstance {
  title: string;
  descriptionLabel: boolean;
  backupLabel: number;
  monitoringLabel: string;
  getCMDBItems?: any;
}

export default function defineCMDBCategories(sequelize: Sequelize) {
  sequelize.define<CMDBCategoryInstance>(
    "CMDBCategory",
    {
      title: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      descriptionLabel: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ""
      },
      backupLabel: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ""
      },
      monitoringLabel: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ""
      },
    },
    {
      //OPTIONS
      tableName: 'cmdb_categories',
      // freezeTableName: true,
    }
  );
}

export function createCMDBCategoriesAssoc(models) {
  models.CMDBCategory.hasMany(models.CMDBItem);
}
