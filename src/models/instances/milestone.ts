import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface MilestoneInstance extends DefaultInstance {
  title: string;
  description: string;
  startsAt: Date;
  endsAt: Date;
}

export default function defineMilestone( sequelize: Sequelize ){
  sequelize.define<MilestoneInstance>(
    "Milestone",
    {
      title: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ""
      },
      startsAt: {
        type: DataTypes.DATE,
      },
      endsAt: {
        type: DataTypes.DATE,
      },
    },
    {
      //OPTIONS
      tableName: 'milestone',
      // freezeTableName: true,
    }
  );
}