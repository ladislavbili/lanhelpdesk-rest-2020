import { Sequelize, DataTypes } from "sequelize";
import DefaultInstance from './defaultInstance';

export interface CMDBAddressInstance extends DefaultInstance {
  nic: string;
  ip: string;
  mask: string;
  gateway: string;
  dns: string;
  vlan: string;
  note: string;
}

export default function defineCMDBAddresses(sequelize: Sequelize) {
  sequelize.define<CMDBAddressInstance>(
    "CMDBAddress",
    {
      nic: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ""
      },
      ip: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ""
      },
      mask: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ""
      },
      gateway: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ""
      },
      dns: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ""
      },
      vlan: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ""
      },
      note: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: ""
      },
    },
    {
      //OPTIONS
      tableName: 'cmdb_addresses',
      // freezeTableName: true,
    }
  );
}

export function createCMDBAddressesAssoc(models) {
  models.CMDBAddress.belongsTo(models.CMDBItem);
}
