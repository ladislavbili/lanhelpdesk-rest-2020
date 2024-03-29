import TriggerableTimer from '@/services/components/triggerableTimer';
import { models } from '@/models';
import moment from 'moment';
import events from 'events';
import {
  timestampToString,
  getMinutes,
  sendTaskNotificationsToUsers,
  logWithDate,
  allNotificationMessages,
  sendNotification,
  createNotificationTaskTitle,
} from '@/helperFunctions';
import fs from 'fs';
import {
  TaskInstance,
  RepeatInstance,
  RepeatTimeInstance,
  RepeatTemplateInstance,
  RepeatTemplateAttachmentInstance,
  ProjectAttributesInstance,
  UserInstance,
  TagInstance,
  ShortSubtaskInstance,
  SubtaskInstance,
  WorkTripInstance,
  MaterialInstance,
  ProjectInstance,
} from '@/models/instances';
import { pubsub } from '@/graph/resolvers';
import { TASK_CHANGE } from '@/configs/subscriptions';
import { repeatTasks } from '@/configs/constants';

export const repeatEvent = new events.EventEmitter();
export const repeatTimeEvent = new events.EventEmitter();

let timers = [];
export default async function start() {
  if (!repeatTasks) {
    logWithDate(`Repeats are disabled!`);
    return;
  }
  repeatEvent.on('add', addRepeat);
  repeatEvent.on('update', updateRepeat);
  repeatEvent.on('delete', deleteRepeat);

  repeatTimeEvent.on('changed', changedRepeatTime);

  const Repeats = <RepeatInstance[]>await models.Repeat.findAll({ where: { active: true } })
  logWithDate(`Repeats are active and currently starting ${Repeats.length} repeats.`);
  Repeats.forEach((Repeat) => addRepeat(Repeat));
}

async function addRepeat(Repeat) {
  const { repeatEvery, repeatInterval, startsAt, id } = Repeat.get();
  logWithDate(`New repeat that triggers every ${getMinutes(repeatEvery, repeatInterval)} minutes`);

  timers.push(
    new TriggerableTimer(
      id,
      startsAt.getTime(),
      getMinutes(repeatEvery, repeatInterval),
      [(repeatTimeId, originalTrigger) => addTask(id, repeatTimeId, originalTrigger)],
    )
  );
}

async function updateRepeat(Repeat) {
  logWithDate('updating repeat');
  const { repeatEvery, repeatInterval, startsAt, active, id } = Repeat.get();
  if (active) {
    const timer = timers.find((existingTimer) => existingTimer.repeatId === id);
    if (timer) {
      timer.stopTimer();
      timer.setTimer(startsAt.valueOf(), getMinutes(repeatEvery, repeatInterval));
      timer.restart();
    } else {
      addRepeat(Repeat);
    }
  } else {
    deleteRepeat(id);
  }
}

async function deleteRepeat(id) {
  logWithDate('deleting repeat');
  const timer = timers.find((existingTimer) => existingTimer.repeatId === id);
  if (timer !== undefined) {
    timers = timers.filter((existingTimer) => existingTimer.repeatId !== id);
    timer.stopTimer();
  }
}

async function changedRepeatTime(repeatId) {
  const timer = timers.find((existingTimer) => existingTimer.repeatId === repeatId);

  if (timer) {
    timer.stopTimer();
    timer.restart();
  }
}

export async function addTask(id, repeatTimeId, originalTrigger, manualTrigger = false) {
  if (!repeatTasks && !manualTrigger) {
    return;
  }
  logWithDate('Creating repeated task');

  const Repeat = <RepeatInstance>await models.Repeat.findByPk(
    id,
    {
      include: [
        {
          model: models.RepeatTemplate,
          include: [
            models.RepeatTemplateAttachment,
            models.ShortSubtask,
            models.Subtask,
            models.WorkTrip,
            models.Material,
            models.Tag,
            {
              model: models.Project,
              include: [models.ProjectAttributes],
            },
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
    logWithDate(`Broken repeat ${id}. Couldn't be loaded.`);
  }
  const RepeatTemplate = <RepeatTemplateInstance>Repeat.get('RepeatTemplate');
  const Project = <ProjectInstance>RepeatTemplate.get('Project');

  if (!repeatTimeId) {
    const newRepeatTime = <RepeatTimeInstance>await models.RepeatTime.create({
      RepeatId: id,
      originalTrigger,
      triggersAt: originalTrigger,
      triggered: true,
    });
    repeatTimeId = newRepeatTime.get('id');
  } else {
    await models.RepeatTime.update({ triggered: true }, { where: { id: repeatTimeId } });
  }

  const attributes = <any>await (<ProjectAttributesInstance>Project.get('ProjectAttribute')).get('attributes');
  let deadline = null;
  if (attributes.deadline.fixed) {
    deadline = parseInt(attributes.deadline.value);
  } else if (RepeatTemplate.get('daysToDeadline')) {
    deadline = moment().add(RepeatTemplate.get('daysToDeadline'), 'days').valueOf();
  }

  let params = {
    //DIRECT PARAMS
    title: RepeatTemplate.get('title'),
    important: RepeatTemplate.get('important'),
    description: RepeatTemplate.get('description'),
    overtime: RepeatTemplate.get('overtime'),
    pausal: RepeatTemplate.get('pausal'),
    //DATES
    deadline,
    closeDate: RepeatTemplate.get('closeDate'),
    pendingDate: RepeatTemplate.get('pendingDate'),
    pendingChangable: RepeatTemplate.get('pendingChangable'),
    statusChange: moment().valueOf(),
    startsAt: moment().valueOf(),
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
    RepeatTimeId: repeatTimeId,
    //EXTERNAL DATA
    ShortSubtasks: (<ShortSubtaskInstance[]>RepeatTemplate.get('ShortSubtasks')).map((ShortSubtask) => ({
      title: ShortSubtask.get('title'),
      done: ShortSubtask.get('done'),
    })),
    Subtasks: (<SubtaskInstance[]>RepeatTemplate.get('Subtasks')).map((Subtask) => ({
      approved: Subtask.get('approved'),
      SubtaskApprovedById: Subtask.get('SubtaskApprovedById'),
      title: Subtask.get('title'),
      order: Subtask.get('order'),
      done: Subtask.get('done'),
      quantity: Subtask.get('quantity'),
      discount: Subtask.get('discount'),
      UserId: Subtask.get('UserId'),
      TaskTypeId: Subtask.get('TaskTypeId'),
    })),
    WorkTrips: (<WorkTripInstance[]>RepeatTemplate.get('WorkTrips')).map((WorkTrip) => ({
      approved: WorkTrip.get('approved'),
      TripApprovedById: WorkTrip.get('TripApprovedById'),
      order: WorkTrip.get('order'),
      done: WorkTrip.get('done'),
      quantity: WorkTrip.get('quantity'),
      discount: WorkTrip.get('discount'),
      UserId: WorkTrip.get('UserId'),
      TripTypeId: WorkTrip.get('TripTypeId'),
    })),
    Materials: (<MaterialInstance[]>RepeatTemplate.get('Materials')).map((Material) => ({
      approved: Material.get('approved'),
      MaterialApprovedById: Material.get('MaterialApprovedById'),
      title: Material.get('title'),
      order: Material.get('order'),
      done: Material.get('done'),
      quantity: Material.get('quantity'),
      margin: Material.get('margin'),
      price: Material.get('price'),
    })),
    TaskMetadata: {
      subtasksApproved: (<SubtaskInstance[]>RepeatTemplate.get('Subtasks')).reduce((acc, cur) => {
        if (cur.approved || Project.get('autoApproved')) {
          return acc + parseFloat(cur.quantity.toString());
        }
        return acc;
      }, 0),
      subtasksPending: (<SubtaskInstance[]>RepeatTemplate.get('Subtasks')).reduce((acc, cur) => {
        if (cur.approved || Project.get('autoApproved')) {
          return acc;
        }
        return acc + parseFloat(cur.quantity.toString());
      }, 0),
      tripsApproved: (<WorkTripInstance[]>RepeatTemplate.get('WorkTrips')).reduce((acc, cur) => {
        if (cur.approved || Project.get('autoApproved')) {
          return acc + parseFloat(cur.quantity.toString());
        }
        return acc;
      }, 0),
      tripsPending: (<WorkTripInstance[]>RepeatTemplate.get('WorkTrips')).reduce((acc, cur) => {
        if (cur.approved || Project.get('autoApproved')) {
          return acc;
        }
        return acc + parseFloat(cur.quantity.toString());
      }, 0),
      materialsApproved: (<MaterialInstance[]>RepeatTemplate.get('Materials')).reduce((acc, cur) => {
        if (cur.approved || Project.get('autoApproved')) {
          return acc + parseFloat(cur.quantity.toString());
        }
        return acc;
      }, 0),
      materialsPending: (<MaterialInstance[]>RepeatTemplate.get('Materials')).reduce((acc, cur) => {
        if (cur.approved || Project.get('autoApproved')) {
          return acc;
        }
        return acc + parseFloat(cur.quantity.toString());
      }, 0),
    }
  }

  //adding data
  const NewTask = <TaskInstance>await models.Task.create(params, {
    include: [models.ShortSubtask, models.Subtask, models.WorkTrip, models.Material, models.TaskAttachment, { model: models.TaskMetadata, as: 'TaskMetadata' }, { model: models.TaskChange, include: [{ model: models.TaskChangeMessage }] }]
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
        logWithDate(err);
      }
    })

  //send task creation message
  const [assignedTos, requester] = await Promise.all([NewTask.getAssignedTos(), NewTask.getRequester()]);
  const taskCreationNotification = allNotificationMessages.creation({
    taskId: NewTask.get('id'),
    title: NewTask.get('title'),
    description: NewTask.get('description'),
  });
  if (assignedTos.every((User2) => User2.get('id') !== requester.get('id'))) {
    sendNotification(
      null,
      requester,
      NewTask,
      `
        ${taskCreationNotification.messageHeader}<br>
        ${createNotificationTaskTitle(params, true)}<br>
        Vykonal: Systém (opakovaná úloha)<br>
        Čas: ${timestampToString(NewTask.get('createdAt').valueOf())}<br><br>
        ${taskCreationNotification.message}
        `,
      taskCreationNotification.subject,
      false
    );
  }
  assignedTos.forEach((assignedTo) => {
    sendNotification(
      null,
      assignedTo,
      NewTask,
      `
        ${taskCreationNotification.messageHeader}<br>
        ${createNotificationTaskTitle(params, true)}<br>
        Vykonal: Systém (opakovaná úloha)<br>
        Čas: ${timestampToString(NewTask.get('createdAt').valueOf())}<br><br>
        ${taskCreationNotification.message}
        `,
      taskCreationNotification.subject,
      false
    );
  });
  pubsub.publish(TASK_CHANGE, { tasksSubscription: true });
  return NewTask;
}
