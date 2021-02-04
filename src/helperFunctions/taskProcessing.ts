import { createDoesNoExistsError } from '@/configs/errors';
import moment from 'moment';
import { timestampToString } from './timeManipulations';

export const createTaskAttributesChangeMessages = async (args, Task) => {
  return (<any[]>await Promise.all(
    [
      { key: 'important', name: 'Important' },
      { key: 'deadline', name: 'Deadline' },
      { key: 'title', name: 'Title' },
      { key: 'description', name: 'Description' },
      { key: 'overtime', name: 'Overtime' },
      { key: 'pausal', name: 'Pausal' },
      { key: 'invoiced', name: 'Invoiced' },
    ].map((attr) => {
      return (
        args[attr.key] !== undefined ?
          createChangeMessage(attr.key, null, attr.name, args[attr.key], Task.get(attr.key)) :
          null
      )
    })
  )).filter((response) => response !== null)
}


export const createChangeMessage = async (type, model, name, newValue, OriginalItem, attribute = 'title') => {
  if (['TaskType', 'Company', 'Milestone', 'Requester', 'Project', 'Status'].includes(type)) {
    let NewItem = await model.findByPk(newValue);
    if (!NewItem) {
      throw createDoesNoExistsError(model.name, newValue);
    }

    return {
      type,
      originalValue: OriginalItem ? OriginalItem.get('id') : null,
      newValue: newValue,
      message: `${name} was changed from ${OriginalItem ? OriginalItem.get(attribute) : 'Nothing'} to ${NewItem ? NewItem.get(attribute) : 'Nothing'}.`,
    }
  } else if (['Tags', 'AssignedTo'].includes(type)) {
    const NewItem = await model.findAll({ where: { id: newValue } });
    return {
      type,
      originalValue: OriginalItem.map((Item) => Item.get('id')).join(','),
      newValue: newValue.join(','),
      message: `${name} were changed from ${OriginalItem.map((Item) => Item.get(attribute)).join(', ')} to ${NewItem.map((Item) => Item.get(attribute)).join(', ')}.`,
    }
  } else if (['CloseDate', 'PendingDate', 'deadline'].includes(type)) {
    return {
      type,
      originalValue: OriginalItem,
      newValue: newValue,
      message: `${name} were changed from ${OriginalItem ? timestampToString(OriginalItem) : 'none'} to ${newValue ? timestampToString(newValue) : 'none'}.`,
    }
  } else if (['PendingChangable', 'important', 'overtime', 'pausal', 'invoiced'].includes(type)) {
    return {
      type,
      originalValue: OriginalItem.toString(),
      newValue: newValue.toString(),
      message: `${name} were changed from ${OriginalItem.toString()} to ${newValue.toString()}.`,
    }
  } else if (['title'].includes(type)) {
    return {
      type,
      originalValue: OriginalItem,
      newValue: newValue,
      message: `${name} were changed from ${OriginalItem} to ${newValue}.`,
    }
  } else if (['description'].includes(type)) {
    return {
      type,
      originalValue: OriginalItem,
      newValue: newValue,
      message: `${name} were changed from "${OriginalItem.substring(0, 50)}..." to "${newValue.substring(0, 50)}."`,
    }
  }
}
