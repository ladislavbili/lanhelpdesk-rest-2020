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
}

export default function defineCompanies( sequelize: Sequelize ){
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
        defaultValue: ''
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
      }

    },
    {
      //OPTIONS
      tableName: 'companies',
      // freezeTableName: true,
    }
  );
}
