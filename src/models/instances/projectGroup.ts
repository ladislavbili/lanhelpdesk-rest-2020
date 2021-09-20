import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface ProjectGroupInstance extends DefaultInstance {
  def: boolean;
  admin: boolean;
  title: string;
  description: string;
  order: number;

  addUser?: any;
  setUsers?: any;

  addCompany?: any;
  setCompanies?: any;
}

export default function defineProjectGroups(sequelize: Sequelize) {
  sequelize.define<ProjectGroupInstance>(
    "ProjectGroup",
    {
      def: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      admin: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      title: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '',
      },
      order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
    },
    {
      //OPTIONS
      tableName: 'project_group',
      // freezeTableName: true,
    }
  );
}

export function createProjectGroupsAssoc(models) {
  models.ProjectGroup.belongsTo(models.Project);
  models.ProjectGroup.hasOne(models.ProjectGroupRights, { onDelete: 'CASCADE' });
  models.ProjectGroup.belongsToMany(models.User, { through: 'user_belongs_to_group' });
  models.ProjectGroup.belongsToMany(models.Company, { through: 'company_belongs_to_group' });
  models.ProjectGroup.belongsToMany(models.Filter, { through: 'filter_groups' });
}
