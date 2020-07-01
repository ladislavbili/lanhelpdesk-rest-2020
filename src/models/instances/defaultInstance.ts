import { Model } from "sequelize";
interface DefaultInstance extends Model {
  id?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export default DefaultInstance;
