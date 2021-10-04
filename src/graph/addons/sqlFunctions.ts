import { DataTypes } from "sequelize";

export const createModelAttributes = (associationName, newAssociationName, model, direct = null) => {
  let attributes = [];
  if (direct && assocTableMaps[direct]) {
    attributes = assocTableMaps[direct];
  } else if (!model) {
    return ``;
  } else {
    attributes = Object.keys(model.rawAttributes).filter((key) => (model.rawAttributes[key].type.toString() !== 'VIRTUAL'));
  }
  if (!newAssociationName) {
    return `
    ${ attributes.reduce(
        (acc, attribute) => `${acc}"${associationName}"."${attribute}",
      ` , ""
      )}
    `
  }
  return `
  ${ attributes.reduce(
      (acc, attribute) => `${acc}"${associationName}"."${attribute}" AS "${newAssociationName}.${attribute}",
    `, ""
    )}
  `
}

export const generateFullNameSQL = (source, target = null) => {
  if (target === null) {
    target = source;
  }
  return ` CONCAT( "${source}"."name", ' ' , "${source}"."surname" ) as "${target}.fullName",`;
}

export const toDBDate = (date) => (new Date(parseInt(date))).toISOString().slice(0, 19).replace('T', ' ');


export const removeLastComma = (string) => string.slice(0, string.lastIndexOf(','));

const assocTableMaps = {
  assignedTosTaskMapAttributes: ["UserId", "TaskId"],
  userBelongsToGroupAttributes: ["UserId", "ProjectGroupId"],
  companyBelongsToGroupAttributes: ["CompanyId", "ProjectGroupId"],
  tagsTaskMapAttributes: ["TagId", "TaskId"],
}
