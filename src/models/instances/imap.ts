import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface ImapInstance extends DefaultInstance {
  active: boolean;
  title: string;
  order: number;
  def: boolean;
  host: string;
  port: number;
  username: string;
  password: string;
  rejectUnauthorized: boolean;
  tls: boolean;
  destination: string;
  ignoredRecieversDestination: string;
  ignoredRecievers: string;
  currentlyTested: boolean;
  errorMessage: string;
  working: boolean;

  setProject?: any;
  setRole?: any;
  setCompany?: any;
}

export default function defineImaps(sequelize: Sequelize) {
  sequelize.define<ImapInstance>(
    "Imap",
    {
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
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
      tls: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      destination: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "Finished"
      },
      ignoredRecievers: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      ignoredRecieversDestination: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: "Service e-mails"
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

export function createImapsAssoc(models) {
  models.Imap.belongsTo(models.Role, { foreignKey: { allowNull: false } });

  models.Imap.belongsTo(models.Company, { foreignKey: { allowNull: false } });

  models.Imap.belongsTo(models.Project, { foreignKey: { allowNull: false } });
}
