import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface InvoicedTaskUserInstance extends DefaultInstance {
  userId: number;
  username: string;
  email: string;
  name: string;
  surname: string;
  fullName: string;
}

export default function defineInvoicedTaskUsers(sequelize: Sequelize) {
  sequelize.define<InvoicedTaskUserInstance>(
    "InvoicedTaskUser",
    {
      userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      username: {
        type: DataTypes.TEXT({ length: "tiny" }),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING({ length: 200 }),
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
        type: DataTypes.TEXT({ length: "tiny" }),
        allowNull: false,
      },
    },
    {
      tableName: 'invoiced_task_users',
    }
  );
}

export function createInvoicedTaskUsersAssoc(models) {
  models.InvoicedTaskUser.belongsTo(models.InvoicedTask, { foreignKey: { allowNull: true }, as: 'assignedTo' });
  models.InvoicedTaskUser.belongsTo(models.InvoicedTask, { foreignKey: { allowNull: true }, as: 'requester' });
  models.InvoicedTaskUser.belongsTo(models.InvoicedTask, { foreignKey: { allowNull: true }, as: 'createdBy' });
  models.InvoicedTaskUser.belongsTo(models.Subtask, { foreignKey: { allowNull: true } });
  models.InvoicedTaskUser.belongsTo(models.WorkTrip, { foreignKey: { allowNull: true } });
}
