import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface TaskInstance extends DefaultInstance {
  title: string;
  important: boolean;
  //assignedTo []
  //tags
  //company - X
  //createdBy - X
  deadline: number; // X
  description: string; // X
  //milestone - ? X
  overtime: boolean; //X
  pausal: boolean; //X
  //project - // X
  /*
  repeatEvery
  repeatInterval
  startsAt
  */
  //requester - ? X
  //status - X
  pendingChangable: boolean; //X
  pendingDate: number; //X
  closeDate: number; //X
  statusChange: number; //X
  invoicedDate: number; //X
  //taskType - X
  setStatus?: any;
  setCompany?: any;
  setTaskType?: any;
  setMilestone?: any;
  setRequester?: any;
  setAssignedTos?: any;
  setProject?: any;
  setTags?: any;

  getAssignedTos?: any;
  getRequester?: any;
  createTaskChange?: any;
  createRepeat?: any;
  setRepeat?: any;
}

export default function defineTasks( sequelize: Sequelize ){
  sequelize.define<TaskInstance>(
    "Task",
    {
      title: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      important: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      closeDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      deadline: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ""
      },
      overtime: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      pausal: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      pendingChangable: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      pendingDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      statusChange: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      invoicedDate: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      //OPTIONS
      tableName: 'tasks',
      // freezeTableName: true,
    }
  );
}
