import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface EmailTargetInstance extends DefaultInstance {
  //email
  address: string;
}

export default function defineEmailTargets(sequelize: Sequelize) {
  sequelize.define<EmailTargetInstance>(
    "EmailTarget",
    {
      address: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      //OPTIONS
      tableName: 'email_targets',
      // freezeTableName: true,
    }
  );
}

export function createEmailTargetsAssoc(models) {
  models.EmailTarget.belongsTo(models.Comment, { foreignKey: { allowNull: false } });
}
