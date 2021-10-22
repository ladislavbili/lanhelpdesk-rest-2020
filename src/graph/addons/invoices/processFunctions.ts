export const processPausalTasks = (tasks, initialWorksPausal, initialTripsPausal) => {

  let worksCount = initialWorksPausal;
  let tripsCount = initialTripsPausal;
  let pausalTasks = tasks.map((task) => ({ ...task, Subtasks: [], WorkTrips: [] }));
  let overPausalTasks = tasks.map((task) => ({ ...task, Subtasks: [], WorkTrips: [] }));

  tasks.forEach((task, index) => {
    task.Subtasks.forEach((work) => {
      const quantity = parseFloat(work.quantity);
      if (quantity <= worksCount) {
        worksCount -= quantity;
        pausalTasks[index].Subtasks.push(work);
      } else if (worksCount === 0) {
        overPausalTasks[index].Subtasks.push(work);
      } else {
        pausalTasks[index].Subtasks.push({ ...work, quantity: worksCount.toString() });
        overPausalTasks[index].Subtasks.push({ ...work, quantity: (quantity - worksCount).toString() });
        worksCount = 0;
      }
    });

    task.WorkTrips.forEach((trip) => {
      const quantity = parseFloat(trip.quantity);
      if (quantity <= tripsCount) {
        tripsCount -= quantity;
        pausalTasks[index].WorkTrips.push(trip);
      } else if (tripsCount === 0) {
        overPausalTasks[index].WorkTrips.push(trip);
      } else {
        pausalTasks[index].WorkTrips.push({ ...trip, quantity: tripsCount.toString() });
        overPausalTasks[index].WorkTrips.push({ ...trip, quantity: (quantity - tripsCount).toString() });
        tripsCount = 0;
      }
    })
  });

  return [
    pausalTasks.filter((task) => task.Subtasks.length > 0 || task.WorkTrips.length > 0),
    overPausalTasks.filter((task) => task.Subtasks.length > 0 || task.WorkTrips.length > 0),
  ];
}

export const addAllRightsToTasks = (tasks) => {
  const allRights = {
    project: {
      //project
      projectRead: true,
      projectWrite: true,

      //tasklist
      companyTasks: true,
      allTasks: true,

      //tasklist view
      tasklistDnD: true,
      tasklistKalendar: true,
      tasklistGantt: true,
      tasklistStatistics: true,

      //add task
      addTask: true,

      //edit task
      deleteTask: true,
      taskImportant: true,
      taskTitleWrite: true,
      taskProjectWrite: true,
      taskDescriptionRead: true,
      taskDescriptionWrite: true,
      taskAttachmentsRead: true,
      taskAttachmentsWrite: true,

      taskSubtasksRead: true,
      taskSubtasksWrite: true,
      taskWorksRead: true,
      taskWorksWrite: true,
      taskWorksAdvancedRead: true,
      taskWorksAdvancedWrite: true,
      taskMaterialsRead: true,
      taskMaterialsWrite: true,
      taskPausalInfo: true,

      //comments and history
      viewComments: true,
      addComments: true,
      internal: true,
      emails: true,
      history: true,
    },
    attributes: {
      status: {
        view: true,
      },
      tags: {
        view: true,
      },
      assigned: {
        view: true,
      },
      requester: {
        view: true,
      },
      company: {
        view: true,
      },
      taskType: {
        view: true,
      },
      pausal: {
        view: true,
      },
      overtime: {
        view: true,
      },
      startsAt: {
        view: true,
      },
      deadline: {
        view: true,
      },
      repeat: {
        view: true,
      },

    }
  }
  return tasks.map((task) => ({
    ...task,
    rights: allRights,
  }))
}

export const addPricesToTasks = (tasks, Prices, Pricelist, Company) => {
  const onlyAfterHoursMultiplier = Pricelist.get('afterHours') / 100;
  const afterHoursMultiplier = onlyAfterHoursMultiplier + 1;
  const materialMarginsLow = Pricelist.get('materialMargin');
  const materialMarginsHigh = Pricelist.get('materialMarginExtra');
  //k cene priratat vsetky zlavy aj afterHours

  return tasks.map((task) => {
    const overtime = task.overtime;
    const SubtaskPrice = Prices.find((Price) => Price.get('TaskTypeId') === task.TaskTypeId && Price.get('type') === 'TaskType');

    return {
      ...task,
      Subtasks: task.Subtasks.map((subtask) => {
        const quantity = parseFloat(subtask.quantity);
        const discount = (100 - parseFloat(subtask.discount)) / 100;
        if (!SubtaskPrice) {
          return {
            ...subtask,
            rawPrice: '0',
            price: '0',
            total: '0',
            overtimePrice: '0',
          }
        }

        return {
          ...subtask,
          rawPrice: SubtaskPrice.get('price'),
          price: (parseFloat(SubtaskPrice.get('price')) * (overtime ? afterHoursMultiplier : 1) * discount).toString(),
          total: (parseFloat(SubtaskPrice.get('price')) * (overtime ? afterHoursMultiplier : 1) * discount * quantity).toString(),
          overtimePrice: (overtime ? onlyAfterHoursMultiplier * parseFloat(SubtaskPrice.get('price')) * discount * quantity : 0).toString(),
        }
      }),
      WorkTrips: task.WorkTrips.map((workTrip) => {
        const Price = Prices.find((Price) => Price.get('TripTypeId') === workTrip.TripTypeId && Price.get('type') === 'TripType');
        const quantity = parseFloat(workTrip.quantity);
        const discount = (100 - parseFloat(workTrip.discount)) / 100;
        if (!Price) {
          return {
            ...workTrip,
            rawPrice: '0',
            price: '0',
            total: '0',
            overtimePrice: '0',
          }
        }

        return {
          ...workTrip,
          rawPrice: Price.get('price'),
          price: (parseFloat(Price.get('price')) * (overtime ? afterHoursMultiplier : 1) * discount).toString(),
          total: (parseFloat(Price.get('price')) * (overtime ? afterHoursMultiplier : 1) * discount * quantity).toString(),
          overtimePrice: (overtime ? onlyAfterHoursMultiplier * parseFloat(Price.get('price')) * discount * quantity : 0).toString(),
        }
      }),
      Materials: task.Materials.map((material) => {
        const price = parseFloat(material.price);
        const quantity = parseFloat(material.quantity);
        if (isNaN(price)) {
          return {
            ...material,
            price: 0,
            total: 0,
          }
        }

        return {
          ...material,
          total: (price * quantity).toString(),
        }
      }),
    }
  });
}

export const getMaterialTasks = (tasks) => {
  return tasks.filter((task) => task.Materials.length > 0);
}

export const calculateTotals = (projectTasks, pausalTasks, overPausalTasks, materialTasks, dph) => {

  let pausalTotals = {
    workHours: 0,
    workOvertime: 0,
    workOvertimeTasks: [],
    workExtraPrice: 0,

    tripHours: 0,
    tripOvertime: 0,
    tripOvertimeTasks: [],
    tripExtraPrice: 0,
  }

  let overPausalTotals = {
    workHours: 0,
    workOvertime: 0,
    workOvertimeTasks: [],
    workExtraPrice: 0,
    workTotalPrice: 0,
    workTotalPriceWithDPH: 0,

    tripHours: 0,
    tripOvertime: 0,
    tripOvertimeTasks: [],
    tripExtraPrice: 0,
    tripTotalPrice: 0,
    tripTotalPriceWithDPH: 0,
  }

  let projectTotals = {
    workHours: 0,
    workOvertime: 0,
    workOvertimeTasks: [],
    workExtraPrice: 0,
    workTotalPrice: 0,
    workTotalPriceWithDPH: 0,

    tripHours: 0,
    tripOvertime: 0,
    tripOvertimeTasks: [],
    tripExtraPrice: 0,
    tripTotalPrice: 0,
    tripTotalPriceWithDPH: 0,
  }

  let materialTotals = {
    price: 0,
    priceWithDPH: 0,
  }

  pausalTasks.map((task) => {
    task.Subtasks.forEach((subtask) => {
      pausalTotals.workHours += parseFloat(subtask.quantity);
      if (task.overtime) {
        pausalTotals.workOvertime += parseFloat(subtask.quantity);
        if (!pausalTotals.workOvertimeTasks.includes(task.id)) {
          pausalTotals.workOvertimeTasks.push(task.id);
        }
        pausalTotals.workExtraPrice += parseFloat(subtask.overtimePrice);
      }
    });
    task.WorkTrips.forEach((workTrip) => {
      pausalTotals.tripHours += parseFloat(workTrip.quantity);
      if (task.overtime) {
        pausalTotals.tripOvertime += parseFloat(workTrip.quantity);
        if (!pausalTotals.tripOvertimeTasks.includes(task.id)) {
          pausalTotals.tripOvertimeTasks.push(task.id);
        }
        pausalTotals.tripExtraPrice += parseFloat(workTrip.overtimePrice);
      }
    });
  });
  //pausalTotals.workExtraPrice = pausalTotals.workExtraPrice * dph;
  //pausalTotals.tripExtraPrice = pausalTotals.tripExtraPrice * dph;

  //same as project
  overPausalTasks.map((task) => {
    task.Subtasks.forEach((subtask) => {
      overPausalTotals.workHours += parseFloat(subtask.quantity);
      if (task.overtime) {
        overPausalTotals.workOvertime += parseFloat(subtask.quantity);
        if (!overPausalTotals.workOvertimeTasks.includes(task.id)) {
          overPausalTotals.workOvertimeTasks.push(task.id);
        }
        overPausalTotals.workExtraPrice += parseFloat(subtask.overtimePrice);
      }
      overPausalTotals.workTotalPrice += parseFloat(subtask.total);
    });
    task.WorkTrips.forEach((trip) => {
      overPausalTotals.tripHours += parseFloat(trip.quantity);
      if (task.overtime) {
        overPausalTotals.tripOvertime += parseFloat(trip.quantity);
        if (!overPausalTotals.tripOvertimeTasks.includes(task.id)) {
          overPausalTotals.tripOvertimeTasks.push(task.id);
        }
        overPausalTotals.tripExtraPrice += parseFloat(trip.overtimePrice);
      }
      overPausalTotals.tripTotalPrice += parseFloat(trip.total);
    });
  });
  //overPausalTotals.workExtraPrice = overPausalTotals.workExtraPrice * dph;
  overPausalTotals.workTotalPriceWithDPH = overPausalTotals.workTotalPrice * dph;
  //overPausalTotals.tripExtraPrice = overPausalTotals.tripExtraPrice * dph;
  overPausalTotals.tripTotalPriceWithDPH = overPausalTotals.tripTotalPrice * dph;

  //same as over pausal
  projectTasks.map((task) => {
    task.Subtasks.forEach((subtask) => {
      projectTotals.workHours += parseFloat(subtask.quantity);
      if (task.overtime) {
        projectTotals.workOvertime += parseFloat(subtask.quantity);
        if (!projectTotals.workOvertimeTasks.includes(task.id)) {
          projectTotals.workOvertimeTasks.push(task.id);
        }
        projectTotals.workExtraPrice += parseFloat(subtask.overtimePrice);
      }
      projectTotals.workTotalPrice += parseFloat(subtask.total);
    });
    task.WorkTrips.forEach((trip) => {
      projectTotals.tripHours += parseFloat(trip.quantity);
      if (task.overtime) {
        projectTotals.tripOvertime += parseFloat(trip.quantity);
        if (!projectTotals.tripOvertimeTasks.includes(task.id)) {
          projectTotals.tripOvertimeTasks.push(task.id);
        }
        projectTotals.tripExtraPrice += parseFloat(trip.overtimePrice);
      }
      projectTotals.tripTotalPrice += parseFloat(trip.total);
    });
  });
  //rojectTotals.workExtraPrice = projectTotals.workExtraPrice * dph;
  projectTotals.workTotalPriceWithDPH = projectTotals.workTotalPrice * dph;
  //projectTotals.tripExtraPrice = projectTotals.tripExtraPrice * dph;
  projectTotals.tripTotalPriceWithDPH = projectTotals.tripTotalPrice * dph;

  //just total with and without dph
  materialTasks.forEach((task) => {
    task.Materials.forEach((material) => {
      materialTotals.price += parseFloat(material.total);
    })
  })
  materialTotals.priceWithDPH = materialTotals.price * dph;

  return {
    pausalTotals,
    overPausalTotals,
    projectTotals,
    materialTotals,
  };
}
