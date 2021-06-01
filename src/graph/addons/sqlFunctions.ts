export const createAttributesFromItem = (associationName, newAssociationName, attributes) => {
  if (!newAssociationName) {
    return `
    ${ attributes.reduce(
        (acc, attribute) => `${acc}"${associationName}"."${attribute}",
      ` , ""
      )}
    `
  }
  return `
  ${attributes.reduce(
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

export const toDBDate = (date) => (new Date(date)).toISOString().slice(0, 19).replace('T', ' ');


export const removeLastComma = (string) => string.slice(0, string.lastIndexOf(','));
