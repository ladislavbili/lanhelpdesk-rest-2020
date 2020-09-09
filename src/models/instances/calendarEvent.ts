import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface CalendarEventInstance extends DefaultInstance {
  //task
  startsAt: number;
  endsAt: number;
}

export default function defineCalendarEvents( sequelize: Sequelize ){
  sequelize.define<CalendarEventInstance>(
    "CalendarEvent",
    {
      startsAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      endsAt: {
        type: DataTypes.DATE,
        allowNull: false,
      },
    },
    {
      //OPTIONS
      tableName: 'calendar_events',
      // freezeTableName: true,
    }
  );
}