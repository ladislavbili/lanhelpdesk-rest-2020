import { Sequelize, Model, DataTypes } from "sequelize";

interface UserInstance extends Model {
  id?: number;
  name: string;
  surname: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const defineUserExample ( sequelize: Sequelize ) => {
  sequelize.define<UserInstance>(
    "User",
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
        //defaultValue: "John Doe"
      },
      surname: {
        type: DataTypes.STRING
      }
    },
    {
      //OPTIONS
      tableName: 'users',
      // freezeTableName: true,
    }
  );
}
