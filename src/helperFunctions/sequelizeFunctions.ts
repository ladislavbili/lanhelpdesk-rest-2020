import {
  capitalizeFirstLetter
} from './stringManipulations';

let loadTimer = 0;

export const getModelAttribute = (item, attribute, globalAttribute = null, parameters = null) => {
  if (item.get && item.get(attribute) !== undefined) {
    return item.get(attribute);
  }

  if (item[attribute] !== undefined) {
    let data = item[attribute];
    if (data === null) {
      return null;
    }
    if (Array.isArray(data)) {
      return data;
    }
    if (Object.keys(data).some((key) => data[key] !== null && data[key] !== undefined)) {
      return data;
    }
    return null;
  }

  console.log('============================');
  console.log(item.constructor, 'direct load', loadTimer++, attribute);

  if (parameters === null) {
    return item[globalAttribute === null ? `get${capitalizeFirstLetter(attribute)}` : globalAttribute]();
  }

  return item[globalAttribute === null ? `get${capitalizeFirstLetter(attribute)}` : globalAttribute](parameters);
}

export const mergeFragmentedModel = (fragments) => {
  const combined = <any>Object.assign({}, ...fragments);
  const NewModel = <any>{
    ...combined,
    ...combined.dataValues,
    get: (attribute = null) => {
      if (attribute === null) {
        return combined;
      } else if (combined[attribute] !== undefined) {
        return combined[attribute]
      } else {
        return combined.dataValues[attribute]
      }
    }
  }
  return NewModel;
}
