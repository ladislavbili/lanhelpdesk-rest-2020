import { createDoesNoExistsError } from '@/configs/errors';
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
    ].map((attr) => {
      return (
        args[attr.key] !== undefined ?
          createChangeMessage(attr.key, null, attr.name, args[attr.key], Task.get(attr.key)) :
          null
      )
    })
  )).filter((response) => response !== null)
}

export const createTaskAttributesNotifications = async (args, Task) => {
  return (<any[]>await Promise.all(
    [
      { key: 'title', name: 'Title' },
      { key: 'description', name: 'Description' },
      { key: 'important', name: 'Important' },
      { key: 'deadline', name: 'Deadline' },
      { key: 'overtime', name: 'Overtime' },
      { key: 'pausal', name: 'Pausal' },
    ].map((attr) => {
      switch (attr.key) {
        case 'title': {
          return (
            args[attr.key] !== undefined ?
              { type: 'title', data: { label: 'Title', oldTitle: Task.get('title'), newTitle: args.title } } :
              null
          )
          break;
        }
        case 'description': {
          return (
            args[attr.key] !== undefined ?
              { type: 'description', data: { label: 'Description', oldDescription: Task.get('description'), newDescription: args.description } } :
              null
          )
          break;
        }

        case 'deadline': {
          return (
            args[attr.key] !== undefined ?
              { type: 'otherAttributes', data: { label: 'Deadline', oldDescription: timestampToString(Task.get('deadline').valueOf()), newDescription: timestampToString(args.deadline) } } :
              null
          )
          break;
        }

        default: {
          return (
            args[attr.key] !== undefined ?
              { type: 'otherAttributes', data: { label: attr.name, old: Task.get(attr.key), new: args[attr.key] } } :
              null
          )
        }
          break;
      }
    })
  )).filter((response) => response !== null)
}

export const createChangeMessage = async (type, model, name, newValue, OriginalItem, attribute = 'title', data = null) => {
  if (['TaskType', 'Company', 'Milestone', 'Requester', 'Project', 'Status'].includes(type)) {
    if (!data && newValue !== null) {
      throw createDoesNoExistsError(model.name, newValue);
    }

    return {
      type,
      originalValue: OriginalItem ? OriginalItem.get('id') : null,
      newValue: newValue,
      message: `${name} was changed from ${OriginalItem ? OriginalItem.get(attribute) : 'Nothing'} to ${data ? data.get(attribute) : 'Nothing'}.`,
    }
  } else if (['Tags', 'AssignedTo'].includes(type)) {
    return {
      type,
      originalValue: OriginalItem.map((Item) => Item.get('id')).join(','),
      newValue: newValue.join(','),
      message: `${name} were changed from ${OriginalItem.map((Item) => Item.get(attribute)).join(', ')} to ${data.map((Item) => Item.get(attribute)).join(', ')}.`,
    }
  } else if (['CloseDate', 'PendingDate', 'deadline'].includes(type)) {
    return {
      type,
      originalValue: OriginalItem ? OriginalItem.getTime() : null,
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
