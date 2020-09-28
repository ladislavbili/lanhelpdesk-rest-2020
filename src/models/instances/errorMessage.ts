import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface ErrorMessageInstance extends DefaultInstance {
  errorMessage: string;
  read: boolean;
  source: string;
  sourceId: number;
  type: string;
}

export default function defineErrorMessages(sequelize: Sequelize) {
  sequelize.define<ErrorMessageInstance>(
    "ErrorMessage",
    {
      errorMessage: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      read: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      source: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ''
      },
      sourceId: {
        type: DataTypes.INTEGER,
      },
      type: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ''
      }
    },
    {
      //OPTIONS
      tableName: 'error_messages',
      // freezeTableName: true,
    }
  );
}

export function createErrorMessagesAssoc(models) {
  models.ErrorMessage.belongsTo(models.User);
}
