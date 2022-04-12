import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface CompanyInstance extends DefaultInstance {
  def: boolean;
  title: string;
  dph: number;
  ico: string;
  dic: string;
  ic_dph: string;
  country: string;
  city: string;
  street: string;
  zip: string;
  email: string;
  phone: string;
  description: string;
  monthly: boolean;
  monthlyPausal: number;
  taskWorkPausal: number;
  taskTripPausal: number;

  createCompanyRent?: any;
  setPricelist?: any;
}

export default function defineCompanies(sequelize: Sequelize) {
  sequelize.define<CompanyInstance>(
    "Company",
    {
      def: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      title: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      dph: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 20
      },
      ico: {
        type: DataTypes.TEXT({ length: "tiny" }),
        allowNull: false,
        defaultValue: ''
      },
      dic: {
        type: DataTypes.TEXT({ length: "tiny" }),
        allowNull: false,
        defaultValue: ''
      },
      ic_dph: {
        type: DataTypes.TEXT({ length: "tiny" }),
        allowNull: false,
        defaultValue: ''
      },
      country: {
        type: DataTypes.TEXT({ length: "tiny" }),
        allowNull: false,
        defaultValue: ''
      },
      city: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ''
      },
      street: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ''
      },
      zip: {
        type: DataTypes.TEXT({ length: "tiny" }),
        allowNull: false,
        defaultValue: ''
      },
      email: {
        type: DataTypes.TEXT({ length: "tiny" }),
        allowNull: true,
        defaultValue: '',
        validate: {
          isEmail: true
        }
      },
      phone: {
        type: DataTypes.TEXT({ length: "tiny" }),
        allowNull: false,
        defaultValue: ''
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ''
      },
      monthly: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      monthlyPausal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      taskWorkPausal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      taskTripPausal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0
      },
    },
    {
      //OPTIONS
      tableName: 'companies',
      // freezeTableName: true,
    }
  );
}

export function createCompaniesAssoc(models) {
  models.Company.belongsTo(models.Pricelist, { foreignKey: { allowNull: false } });

  models.Company.hasMany(models.User);

  models.Company.hasMany(models.CompanyRent, { foreignKey: { allowNull: false } });

  models.Company.hasMany(models.Imap, { foreignKey: { allowNull: false } });

  models.Company.hasMany(models.ProjectAttributes, { as: 'defCompany' });

  models.Company.belongsToMany(models.Filter, { as: { singular: "filterCompany", plural: "filterCompanies" }, through: 'filter_company' });

  models.Company.hasMany(models.Task);

  models.Company.hasMany(models.RepeatTemplate);

  models.Company.belongsToMany(models.ProjectGroup, { through: 'company_belongs_to_group' });

  //CMDB
  models.Company.hasOne(models.CMDBScheme, { onDelete: 'CASCADE' });
  models.Company.hasMany(models.CMDBManual, { onDelete: 'CASCADE' });
  models.Company.hasMany(models.CMDBItem, { onDelete: 'CASCADE' });

  models.Company.hasMany(models.CMDBPassword, { onDelete: 'CASCADE' });
}
