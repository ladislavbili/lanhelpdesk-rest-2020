import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface ImapInstance extends DefaultInstance {
  title: string;
  order: number;
  def: boolean;
  host: string;
  port: number;
  username: string;
  password: string;
  rejectUnauthorized: boolean;
  tsl: boolean;
  currentlyTested: boolean;
  errorMessage: string;
  working: boolean;
}

export default function defineImaps( sequelize: Sequelize ){
  sequelize.define<ImapInstance>(
    "Imap",
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
      tsl: {
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
      tableName: 'imaps',
      // freezeTableName: true,
    }
  );
}
