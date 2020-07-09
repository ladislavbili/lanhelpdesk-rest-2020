import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';
import { randomString } from 'helperFunctions';

export interface UserInstance extends DefaultInstance {
  active: boolean;
  username: string;
  email: string;
  name: string;
  surname: string;
  password: string;
  receiveNotifications: boolean;
  signature: string;
  tokenKey: string;
  setTags?: any;
  setRole?: any;
  createToken?: any;
}

export default function defineUsers( sequelize: Sequelize ){
  sequelize.define<UserInstance>(
    "User",
    {
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      username: {
        type: DataTypes.TEXT({ length: "tiny" }),
        allowNull: false,
      },
      email: {
        type: DataTypes.TEXT({ length: "tiny" }),
        allowNull: false,
        validate: {
          isEmail: true
        }
      },
      name: {
        type: DataTypes.TEXT({ length: "tiny" }),
        allowNull: false,
      },
      surname: {
        type: DataTypes.TEXT({ length: "tiny" }),
        allowNull: false,
      },
      fullName: {
        type: DataTypes.VIRTUAL,
        get() {
          return `${this.get('name')} ${this.get('surname')}`
        }
      },
      password: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      receiveNotifications: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      signature: {
        type: DataTypes.STRING({ length: 2000 }),
        allowNull: false,
        defaultValue: "",
      },
      tokenKey: {
        type: DataTypes.TEXT({ length: "tiny" }),
        allowNull: false,
        defaultValue:  randomString(),
      },
    },
    {
      indexes: [
        {
          unique: true,
          fields: ['email']
        }
      ],
      //OPTIONS
      tableName: 'users',
      // freezeTableName: true,
    }
  );
}
