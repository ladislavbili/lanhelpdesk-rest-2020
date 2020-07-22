import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface SmtpInstance extends DefaultInstance {
  title: string;
  order: number;
  def: boolean;
  host: string;
  port: number;
  username: string;
  password: string;
  rejectUnauthorized: boolean;
  secure: boolean;
  currentlyTested: boolean;
  errorMessage: string;
  working: boolean;
}

export default function defineSmtps( sequelize: Sequelize ){
  sequelize.define<SmtpInstance>(
    "Smtp",
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
      def: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      host: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      port: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      username: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      password: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      rejectUnauthorized: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      secure: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      currentlyTested: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      working: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      //OPTIONS
      tableName: 'smtps',
      // freezeTableName: true,
    }
  );
}
