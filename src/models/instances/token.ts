import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface TokenInstance extends DefaultInstance {
  key: string;
  expiresAt: number;
}

export default function defineTokens(sequelize: Sequelize) {
  sequelize.define<TokenInstance>(
    "Token",
    {
      key: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
    },
    {
      //OPTIONS
      tableName: 'tokens',
      // freezeTableName: true,
    }
  );
}

export function createTokensAssoc(models) {
  models.Token.belongsTo(models.User);
}
