import {
  capitalizeFirstLetter
} from './stringManipulations';

let loadTimer = 0;

export const getModelAttribute = (item, attribute, globalAttribute = null, parameters = null) => {
  if (item.get(attribute) !== undefined) {
    return item.get(attribute);
  }
  console.log('============================');
  console.log(item.constructor, 'direct load', loadTimer++, attribute);


  if (parameters === null) {
    return item[globalAttribute === null ? `get${capitalizeFirstLetter(attribute)}` : globalAttribute]();
  }

  return item[globalAttribute === null ? `get${capitalizeFirstLetter(attribute)}` : globalAttribute](parameters);
}
