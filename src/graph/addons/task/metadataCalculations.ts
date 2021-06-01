export const calculateMetadata = (autoApproved, subtasks, workTrips, materials, customItems) => {
  let subtasksApproved = 0;
  let subtasksPending = 0;
  let tripsApproved = 0;
  let tripsPending = 0;
  let materialsApproved = 0;
  let materialsPending = 0;
  let itemsApproved = 0;
  let itemsPending = 0;

  if (subtasks) {
    subtasks.map((subtask) => {
      if (subtask.approved || autoApproved) {
        subtasksApproved += parseFloat(<any>subtask.quantity);
      } else {
        subtasksPending += parseFloat(<any>subtask.quantity);
      }
    })
  }

  if (workTrips) {
    workTrips.map((trip) => {
      if (trip.approved || autoApproved) {
        tripsApproved += parseFloat(<any>trip.quantity);
      } else {
        tripsPending += parseFloat(<any>trip.quantity);
      }
    })
  }

  if (materials) {
    materials.map((material) => {
      if (material.approved || autoApproved) {
        materialsApproved += parseFloat(<any>material.quantity);
      } else {
        materialsPending += parseFloat(<any>material.quantity);
      }
    })
  }

  if (customItems) {
    customItems.map((customItem) => {
      if (customItem.approved || autoApproved) {
        itemsApproved += parseFloat(<any>customItem.quantity);
      } else {
        itemsPending += parseFloat(<any>customItem.quantity);
      }
    })
  }
  return {
    subtasksApproved,
    subtasksPending,
    tripsApproved,
    tripsPending,
    materialsApproved,
    materialsPending,
    itemsApproved,
    itemsPending,
  }
}
