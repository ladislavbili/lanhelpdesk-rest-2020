import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface EmailInstance extends DefaultInstance {
  //from user
  //task
  //to adresses
  subject: string;
  message: string;
}

export default function defineEmails(sequelize: Sequelize) {
  sequelize.define<EmailInstance>(
    "Email",
    {
      subject: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
    },
    {
      //OPTIONS
      tableName: 'emails',
      // freezeTableName: true,
    }
  );
}
