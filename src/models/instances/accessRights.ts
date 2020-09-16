import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface AccessRightsInstance extends DefaultInstance {
  //general rules
  login: boolean;
  testSections: boolean;
  mailViaComment: boolean;
  vykazy: boolean;
  publicFilters: boolean;
  addProjects: boolean;
  viewVykaz: boolean;
  viewRozpocet: boolean;
  viewErrors: boolean;
  viewInternal: boolean;

  //settings access
  users: boolean;
  companies: boolean;
  pausals: boolean;
  projects: boolean;
  statuses: boolean;
  units: boolean;
  prices: boolean;
  suppliers: boolean;
  tags: boolean;
  invoices: boolean;
  roles: boolean;
  taskTypes: boolean;
  tripTypes: boolean;
  imaps: boolean;
  smtps: boolean;
}

export default function defineAccessRights(sequelize: Sequelize) {
  sequelize.define<AccessRightsInstance>(
    "AccessRights",
    {
      //general rules
      login: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      testSections: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      mailViaComment: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      vykazy: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      publicFilters: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      addProjects: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      viewVykaz: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      viewRozpocet: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      viewErrors: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      viewInternal: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },

      //settings access

      users: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      companies: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      pausals: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      projects: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      statuses: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      units: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      prices: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      suppliers: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      tags: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      invoices: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      roles: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      taskTypes: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      tripTypes: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      imaps: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      smtps: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
    },
    {
      //OPTIONS
      tableName: 'access_rights',
      // freezeTableName: true,
    }
  );
}
