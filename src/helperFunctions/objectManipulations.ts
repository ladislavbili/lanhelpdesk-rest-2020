import { capitalizeFirstLetter } from './stringManipulations';

export const flattenObject = (object, prefix = '') => {
  let newObject = {};
  Object.keys(object).map((firstKey) => {
    Object.keys(object[firstKey]).map((secondKey) => {
      newObject[`${prefix}${prefix === '' ? firstKey : capitalizeFirstLetter(firstKey)}${capitalizeFirstLetter(secondKey)}`] = object[firstKey][secondKey];
    })
  })
  return newObject;
}
