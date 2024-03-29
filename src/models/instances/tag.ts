import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface TagInstance extends DefaultInstance {
  title: string;
  color: string;
  order: number;
}

export default function defineTags(sequelize: Sequelize) {
  sequelize.define<TagInstance>(
    "Tag",
    {
      title: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      color: {
        type: DataTypes.TEXT({ length: "tiny" }),
        allowNull: false,
        defaultValue: "#f759f2"
      },
      order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
    },
    {
      //OPTIONS
      tableName: 'tags',
      // freezeTableName: true,
    }
  );
}

export function createTagsAssoc(models) {
  models.Tag.belongsToMany(models.ProjectAttributes, { through: 'project_attributes_def_tags' });
  models.Tag.belongsTo(models.Project, { as: 'ofProject' });
  models.Tag.belongsToMany(models.Task, { through: 'task_has_tags' });
  models.Tag.belongsToMany(models.RepeatTemplate, { through: 'repeat_template_has_tags' });

  models.Tag.belongsToMany(models.Filter, { as: { singular: "tagFilter", plural: "tagFilters" }, through: 'filter_tags' });
}
