import { models } from '@/models';
import { createDoesNoExistsError } from '@/configs/errors';

export const logFunctionsOfModel = (model) => {
  Object.keys(model.associations).forEach((assoc) => {
    Object.keys(model.associations[assoc].accessors).forEach((accessor) => {
      console.log(model.name + '.' + model.associations[assoc].accessors[accessor] + '()');
    })
  })
}

//one model one item
export const idDoesExists = async (id: number, model) => {
  return (await model.findByPk(id) !== null);
}

//one model multiple items
export const idsDoExists = async (ids: number[], model) => {
  const count = await model.count({
    where: {
      id: ids
    },
  });
  return count === ids.length
}

//pairs of model and item
export const multipleIdDoesExists = async (pairs) => {
  let promises = pairs.map((pair) => pair.model.findByPk(pair.id));
  let responses = await Promise.all(promises);
  return responses.some((response) => response === null);
}

//With automatic errors

//one model one item
export const idDoesExistsCheck = async (id: number, model) => {
  if (await model.findByPk(id) === null) {
    throw createDoesNoExistsError(model.name, id);
  }
}

//one model multiple items
export const idsDoExistsCheck = async (ids: number[], model) => {
  const responses = await Promise.all(ids.map((id) => model.findByPk(id)))
  if (responses.some((response) => response === null)) {
    const failedIds = ids.filter((id, index) => responses[index] === null);
    throw createDoesNoExistsError(model.name, failedIds);
  }
}

//pairs of model and item
export const multipleIdDoesExistsCheck = async (pairs) => {
  const promises = pairs.map((pair) => pair.model.findByPk(pair.id));
  const responses = await Promise.all(promises);
  if (responses.some((response) => response === null)) {
    const failedPairs = pairs.filter((pair, index) => responses[index] === null);
    throw createDoesNoExistsError(failedPairs.map((pair) => `${pair.model.name} - id:${pair.id}`).toString());
  }
}
