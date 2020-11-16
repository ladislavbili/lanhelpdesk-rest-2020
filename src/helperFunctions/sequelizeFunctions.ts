import {
  capitalizeFirstLetter
} from './stringManipulations';

export const getModelAttribute = (item, attribute, globalAttribute = null, parameters = null) => {
  if (item.get(attribute) !== undefined) {
    return item.get(attribute);
  }
  if (parameters === null) {
    return item[globalAttribute === null ? `get${capitalizeFirstLetter(attribute)}` : globalAttribute]();
  }

  return item[globalAttribute === null ? `get${capitalizeFirstLetter(attribute)}` : globalAttribute]();
}
