import TriggerableTimer from '@/services/components/triggerableTimer';
import { models } from '@/models';
import moment from 'moment';
import events from 'events';
import { timestampToString, getMinutes, sendNotifications } from '@/helperFunctions';
import fs from 'fs';
import {
  TaskInstance,
  RepeatInstance,
  RepeatTemplateInstance,
  RepeatTemplateAttachmentInstance,
  UserInstance,
  TagInstance,
  ShortSubtaskInstance,
  ScheduledTaskInstance,
  SubtaskInstance,
  WorkTripInstance,
  MaterialInstance,
  CustomItemInstance,
} from '@/models/instances';
import { pubsub } from '@/graph/resolvers';
import { TASK_CHANGE } from '@/configs/subscriptions';
import { repeatTasks } from '@/configs/constants';

export const repeatEvent = new events.EventEmitter();

let timers = [];
export default async function start() {
  if (!repeatTasks) {
    console.log(`Repeats are disabled!`);
    return;
  }
  repeatEvent.on('add', addRepeat)
  repeatEvent.on('update', updateRepeat)
  repeatEvent.on('delete', deleteRepeat)

  const Repeats = <RepeatInstance[]>await models.Repeat.findAll({ where: { active: true } })
  console.log(`Repeats are active and currently starting ${Repeats.length} repeats.`);
  Repeats.forEach((Repeat) => addRepeat(Repeat));
}

async function addRepeat(Repeat) {
  const { repeatEvery, repeatInterval, startsAt, id } = Repeat.get();
  console.log(`New repeat that triggers every ${getMinutes(repeatEvery, repeatInterval)} minutes`);

  timers.push(
    new TriggerableTimer(
      id,
      startsAt.getTime(),
      getMinutes(repeatEvery, repeatInterval),
      [() => addTask(id)],
    )
  );
}

async function updateRepeat(Repeat) {
  console.log('updating repeat');
  const { repeatEvery, repeatInterval, startsAt, active, id } = Repeat.get();
  if (active) {
    const timer = timers.find((existingTimer) => existingTimer.id === id);
    timer.stopTimer();
    timer.setTimer(startsAt.valueOf(), getMinutes(repeatEvery, repeatInterval));
    timer.restart();
  } else {
    deleteRepeat(id);
  }
}

async function deleteRepeat(id) {
  console.log('deleting repeat');
  const timer = timers.find((existingTimer) => existingTimer.id === id);
  if (timer !== undefined) {
    timers = timers.filter((existingTimer) => existingTimer.id !== id);
    timer.stopTimer();
  }
}

async function addTask(id) {
  if (!repeatTasks) {
    return;
  }
  console.log('Creating repeated task');

  const Repeat = <RepeatInstance>await models.Repeat.findByPk(
    id,
    {
      include: [
        {
          model: models.RepeatTemplate,
          include: [
            models.RepeatTemplateAttachment,
            models.ShortSubtask,
            models.ScheduledTask,
            models.Subtask,
            models.WorkTrip,
            models.Material,
            models.CustomItem,
            models.Tag,
            {
              model: models.User,
              as: 'assignedTos'
            }
          ]
        },
      ]
    }
  );
  if (!Repeat) {
    console.log(`Broken repeat ${id}. Couldn't be loaded.`);
  }
  const RepeatTemplate = <RepeatTemplateInstance>Repeat.get('RepeatTemplate');

  let params = {
    //DIRECT PARAMS
    title: RepeatTemplate.get('title'),
    important: RepeatTemplate.get('important'),
    description: RepeatTemplate.get('description'),
    overtime: RepeatTemplate.get('overtime'),
    pausal: RepeatTemplate.get('pausal'),
    //DATES
    deadline: RepeatTemplate.get('deadline'),
    closeDate: RepeatTemplate.get('closeDate'),
    pendingDate: RepeatTemplate.get('pendingDate'),
    pendingChangable: RepeatTemplate.get('pendingChangable'),
    statusChange: moment().valueOf(),
    invoicedDate: null,

    TaskChanges: [{
      UserId: null,
      TaskChangeMessages: [{
        type: 'task',
        originalValue: null,
        newValue: null,
        message: `Task was created by task repeat.`,
      }]
    }],
    //ID PARAMS
    createdById: null,
    CompanyId: RepeatTemplate.get('CompanyId'),
    ProjectId: RepeatTemplate.get('ProjectId'),
    MilestoneId: RepeatTemplate.get('MilestoneId'),
    requesterId: RepeatTemplate.get('requesterId'),
    TaskTypeId: RepeatTemplate.get('TaskTypeId'),
    StatusId: RepeatTemplate.get('StatusId'),
    RepeatId: id,
    //EXTERNAL DATA
    ShortSubtasks: (<ShortSubtaskInstance[]>RepeatTemplate.get('ShortSubtasks')).map((ShortSubtask) => ({
      title: ShortSubtask.get('title'),
      done: ShortSubtask.get('done'),
    })),
    ScheduledTasks: (<ScheduledTaskInstance[]>RepeatTemplate.get('ScheduledTasks')).map((ScheduledTask) => ({
      UserId: ScheduledTask.get('UserId'),
      from: ScheduledTask.get('from'),
      to: ScheduledTask.get('to'),
    })),
    Subtasks: (<SubtaskInstance[]>RepeatTemplate.get('Subtasks')).map((Subtask) => ({
      title: Subtask.get('title'),
      order: Subtask.get('order'),
      done: Subtask.get('done'),
      quantity: Subtask.get('quantity'),
      discount: Subtask.get('discount'),
      UserId: Subtask.get('UserId'),
      TaskTypeId: Subtask.get('TaskTypeId'),
    })),
    WorkTrips: (<WorkTripInstance[]>RepeatTemplate.get('WorkTrips')).map((WorkTrip) => ({
      order: WorkTrip.get('order'),
      done: WorkTrip.get('done'),
      quantity: WorkTrip.get('quantity'),
      discount: WorkTrip.get('discount'),
      UserId: WorkTrip.get('UserId'),
      TripTypeId: WorkTrip.get('TripTypeId'),
    })),
    Materials: (<MaterialInstance[]>RepeatTemplate.get('Materials')).map((Material) => ({
      title: Material.get('title'),
      order: Material.get('order'),
      done: Material.get('done'),
      quantity: Material.get('quantity'),
      margin: Material.get('margin'),
      price: Material.get('price'),
    })),
    CustomItems: (<CustomItemInstance[]>RepeatTemplate.get('CustomItems')).map((CustomItem) => ({
      title: CustomItem.get('title'),
      order: CustomItem.get('order'),
      done: CustomItem.get('done'),
      quantity: CustomItem.get('quantity'),
      price: CustomItem.get('price'),
    })),
  }

  //adding data
  const NewTask = <TaskInstance>await models.Task.create(params, {
    include: [models.ScheduledTask, models.ShortSubtask, models.Subtask, models.WorkTrip, models.Material, models.CustomItem, models.TaskAttachment, { model: models.TaskChange, include: [{ model: models.TaskChangeMessage }] }]
  });

  await Promise.all([
    NewTask.setAssignedTos((<UserInstance[]>RepeatTemplate.get('assignedTos')).map((User) => User.get('id'))),
    NewTask.setTags((<TagInstance[]>RepeatTemplate.get('Tags')).map((Tag) => Tag.get('id'))),
  ])


  //Duplicate Attachments
  if (!fs.existsSync('files')) {
    fs.mkdirSync('files');
  }
  if (!fs.existsSync('files/task-attachments')) {
    fs.mkdirSync('files/task-attachments');
  }
  if (!fs.existsSync(`files/task-attachments/${NewTask.get('id')}`)) {
    fs.mkdirSync(`files/task-attachments/${NewTask.get('id')}`);
  }
  const newFolderPath = `files/task-attachments/${NewTask.get('id')}/${moment().valueOf()}`;
  (<RepeatTemplateInstance[]>RepeatTemplate.get('RepeatTemplateAttachments'))
    .filter((Attachment) => fs.existsSync(<string>Attachment.get('path')))
    .map((Attachment, index) => {
      try {
        const newFilePath = `${newFolderPath}${index}-${Attachment.get('filename')}`;
        fs.createReadStream(<string>Attachment.get('path')).pipe(fs.createWriteStream(newFilePath));
        return NewTask.createTaskAttachment(
          {
            filename: Attachment.get('filename'),
            mimetype: Attachment.get('mimetype'),
            encoding: Attachment.get('encoding'),
            size: Attachment.get('size'),
            path: newFilePath,
          }
        )
      } catch (err) {
        console.log(err);
      }
    })


  sendNotifications(null, [`Task was created by repeat.`], NewTask, (<UserInstance[]>RepeatTemplate.get('assignedTos')).map((User) => User.get('id')));
  pubsub.publish(TASK_CHANGE, { taskSubscription: { type: 'add', data: NewTask, ids: [] } });
  return;
}
