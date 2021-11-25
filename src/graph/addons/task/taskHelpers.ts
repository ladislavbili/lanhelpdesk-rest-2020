import gqlFields from 'graphql-fields';

const wasRequested = (object, attribute) => {
  return Object.keys(object).some((key) => key === attribute);
}

const parameterExists = (item) => item !== undefined && item !== null;

export const getTasksWantedData = (filter, sort, milestoneSort, stringFilter, info) => {
  const infoData = gqlFields(info);
  const taskData = infoData.tasks;
  //je rozdiel ak filtrujeme ID, alebo STRING
  //ak potrebujeme STRING na SORT/FILTER filter = true
  //ak su data pozadovane na stranke, data = true
  let wantedData = {
    project: {
      filter: false,
      data: wasRequested(taskData, 'project')
    },
    assignedTo: {
      filter: false,
      data: wasRequested(taskData, 'assignedTo')
    },
    company: {
      filter: false,
      data: wasRequested(taskData, 'company')
    },
    milestone: {
      filter: milestoneSort === true,
      data: wasRequested(taskData, 'milestone'),
    },
    requester: {
      filter: false,
      data: wasRequested(taskData, 'requester')
    },
    status: {
      filter: false,
      data: wasRequested(taskData, 'status')
    },
    tags: {
      filter: false,
      data: wasRequested(taskData, 'tags')
    },
    taskType: {
      filter: false,
      data: wasRequested(taskData, 'taskType')
    },
    totals: wasRequested(infoData, 'totals'),
  };

  //by sort
  if (parameterExists(sort) && wantedData[sort.key] !== undefined) {
    wantedData[sort.key].filter = true;
    wantedData[sort.key].data = true;
  }

  //by string filter
  if (stringFilter) {
    [
      'status',
      'requester',
      'company',
      'project',
      'taskType',
      'milestone',
      'assignedTo',
      'tags'
    ].forEach((key) => {
      if (stringFilter[key] && stringFilter[key].length > 0) {
        wantedData[key].filter = true;
      }
    });
  }

  return wantedData;
}
