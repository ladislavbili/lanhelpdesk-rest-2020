import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface CompanyInstance extends DefaultInstance {
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
        allowNull: false,
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
        type: DataTypes.FLOAT(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      taskWorkPausal: {
        type: DataTypes.FLOAT(10, 2),
        allowNull: false,
        defaultValue: 0
      },
      taskTripPausal: {
        type: DataTypes.FLOAT(10, 2),
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

  models.Company.hasMany(models.Project, { as: 'defCompany' });

  models.Company.hasMany(models.Filter, { as: 'filterCompany' });

  models.Company.hasMany(models.Task);
}
