import TriggerableTimer from '@/services/components/triggerableTimer';
import { models } from '@/models';
import moment from 'moment';
import events from 'events';
import { TaskInstance } from '@/models/instances';
import { pubsub } from '@/graph/resolvers';
import { TASK_CHANGE } from '@/configs/subscriptions';

export const repeatEvent = new events.EventEmitter();

let timers = [];
export default function start() {
  repeatEvent.on('add', addRepeat)
  repeatEvent.on('update', updateRepeat)
  repeatEvent.on('delete', deleteRepeat)
  models.Repeat.findAll().then((repeatResponse) => {
    console.log('repeatsLoaded', repeatResponse.length);
    repeatResponse.forEach((repeat) => addRepeat(repeat));
  });
}

async function addRepeat(repeat) {
  console.log('addingRepeat');

  const { repeatEvery, repeatInterval, startsAt, id } = repeat.get();
  timers.push(
    new TriggerableTimer(
      moment(startsAt).valueOf(),
      getMinutes(repeatEvery, repeatInterval),
      [() => addTask(repeat)], () => { timers = timers.filter((existingTimer) => existingTimer.id !== id) },
      id
    )
  );
}

async function updateRepeat(repeat) {
  console.log('updating repeat');
  const { repeatEvery, repeatInterval, startsAt, id } = repeat.get();
  const timer = timers.find((existingTimer) => existingTimer.id === id);
  timer.stopTimer();
  timer.setTimer(moment(startsAt).valueOf(), getMinutes(repeatEvery, repeatInterval), [() => addTask(repeat)])
  timer.restart();
}

async function deleteRepeat(id) {
  console.log('deleting repeat');

  const timer = timers.find((existingTimer) => existingTimer.id === id);
  if (timer !== undefined) {
    timers = timers.filter((existingTimer) => existingTimer.id !== id);
    timer.stopTimer();
  }
}

function getMinutes(repeatEvery, repeatInterval) {
  let multiplier = multipliers[repeatInterval];
  if (multiplier === undefined || repeatEvery === 0) {
    return 24 * 60;
  }
  return multiplier * repeatEvery;
}

const multipliers = {
  day: 24 * 60,
  week: 7 * 24 * 60,
  month: 30 * 24 * 60,
}

async function addTask(repeat) {
  const OriginalTask = await repeat.getTask({
    include: [
      { model: models.Repeat },
      { model: models.Status },
      { model: models.Subtask },
      { model: models.WorkTrip },
      { model: models.Material },
      { model: models.CustomItem },
      { model: models.Tag },
      {
        model: models.User,
        as: 'assignedTos'
      },
      {
        model: models.Project,
        include: [
          { model: models.ProjectRight },
          { model: models.Milestone }
        ]
      },
    ]
  });

  const {
    title,
    important,
    closeDate,
    deadline,
    description,
    overtime,
    pasual,
    pendingChangable,
    pendingDate,
    invoicedDate,
    CompanyId,
    createdById,
    UserId,
    MilestoneId,
    ProjectId,
    requesterId,
    StatusId,
    TaskTypeId,
  } = OriginalTask.get();
  const OriginalRepeat = OriginalTask.get('Repeat');
  const originalRepeatData = OriginalRepeat.get();

  const OriginalSubtasks = OriginalTask.get('Subtasks');
  const originalSubtasksData = OriginalSubtasks.map((Subtask) => Subtask.get());

  const OriginalWorkTrips = OriginalTask.get('WorkTrips');
  const originalWorkTripsData = OriginalWorkTrips.map((WorkTrip) => WorkTrip.get());

  const OriginalMaterials = OriginalTask.get('Materials');
  const originalMaterialsData = OriginalMaterials.map((Material) => Material.get());

  const OriginalCustomItems = OriginalTask.get('CustomItems');
  const originalCustomItemsData = OriginalCustomItems.map((CustomItem) => CustomItem.get());

  const orginalTagIds = OriginalTask.get('Tags').map((tag) => tag.id)
  const orginalAssignedToIds = OriginalTask.get('assignedTos').map((user) => user.id)
  let params = {
    title,
    important,
    closeDate,
    deadline,
    description,
    overtime,
    pasual,
    pendingChangable,
    pendingDate,
    statusChange: moment().valueOf(),
    invoicedDate,
    CompanyId,
    createdById,
    UserId,
    MilestoneId,
    ProjectId,
    requesterId,
    StatusId,
    TaskTypeId,
    TaskChanges: [{
      UserId: null,
      TaskChangeMessages: [{
        type: 'repeat',
        originalValue: null,
        newValue: null,
        message: `Task was created by repeating API`,
      }]
    }],
    Repeat: {
      startsAt: originalRepeatData.startsAt,
      repeatEvery: originalRepeatData.repeatEvery,
      repeatInterval: originalRepeatData.repeatInterval
    },

    Subtasks: originalSubtasksData.map((subtask) => ({
      title: subtask.title,
      order: subtask.order,
      done: subtask.done,
      quantity: subtask.quantity,
      discount: subtask.discount,
      TaskTypeId: subtask.TaskTypeId,
      UserId: subtask.UserId
    })),
    WorkTrips: originalWorkTripsData.map((workTrip) => ({
      order: workTrip.order,
      done: workTrip.done,
      quantity: workTrip.quantity,
      discount: workTrip.discount,
      TripTypeId: workTrip.TripTypeId,
      UserId: workTrip.UserId
    })),
    Materials: originalMaterialsData.map((material) => ({
      title: material.title,
      order: material.order,
      done: material.done,
      quantity: material.quantity,
      margin: material.margin,
      price: material.price,
    })),
    CustomItems: originalCustomItemsData.map((customItem) => ({
      title: customItem.title,
      order: customItem.order,
      done: customItem.done,
      quantity: customItem.quantity,
      price: customItem.price,
    })),
  }

  const NewTask = <TaskInstance>await models.Task.create(params, {
    include: [
      { model: models.Repeat },
      { model: models.Comment },
      { model: models.Subtask },
      { model: models.WorkTrip },
      { model: models.Material },
      { model: models.CustomItem }, {
        model: models.TaskChange,
        include: [
          { model: models.TaskChangeMessage }
        ]
      }
    ]
  });
  await NewTask.setAssignedTos(orginalTagIds);
  await NewTask.setTags(orginalAssignedToIds);
  addRepeat(await NewTask.getRepeat());
  pubsub.publish(TASK_CHANGE, { taskSubscription: { type: 'add', data: NewTask, ids: [] } });
  await repeat.destroy();
}
