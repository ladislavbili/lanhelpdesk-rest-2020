import {
  models
} from '@/models';
import { hash } from 'bcrypt';
import { randomString } from '@/helperFunctions';
import {
  TaskInstance,
} from '@/models/instances';

export const createTaskMetadata = async () => {
  const tasks = <TaskInstance[]>await models.Task.findAll({
    include: [{
      model: models.TaskMetadata,
      as: 'TaskMetadata'
    }]
  });

  tasks.filter((task) => !task.get('TaskMetadata')).forEach((task) => {
    task.createTaskMetadata({
      subtasksApproved: 0,
      subtasksPending: 0,
      tripsApproved: 0,
      tripsPending: 0,
      materialsApproved: 0,
      materialsPending: 0,
      itemsApproved: 0,
      itemsPending: 0,
    })
  })
}

export const addDefaultDatabaseData = async () => {
  /*
  await models.Role.truncate({cascade: true});
  await models.Company.truncate({cascade: true});
  await models.User.truncate({cascade: true});
  */
  const Role = await createRole();
  const Company = await createCompany();
  defaultUsers(Role.get('id'), Company.get('id')).forEach((user) => addUser(user));
  addDefaultStatusTemplates();
}

export const addUser = async ({ password, roleId, companyId, language, ...targetUserData }) => {
  const hashedPassword = await hash(password, 12);
  return models.User.create({
    ...targetUserData,
    password: hashedPassword,
    tokenKey: randomString(),
    RoleId: roleId,
    CompanyId: companyId,
    language: language ? language : 'sk',
  })
}

async function createRole() {
  return models.Role.create({
    title: 'Administrator',
    order: 1,
    level: 0,
    AccessRight: createFullRights()
  }, {
      include: [{ model: models.AccessRights }]
    });
}

async function createCompany() {

  const Pricelist = await models.Pricelist.create({
    title: 'Lanhelpdesk pricelist', order: '1', afterHours: 4, def: true, materialMargin: 10, materialMarginExtra: 20
  });

  return models.Company.create({
    title: 'LanHelpdesk Team', dph: '20', ico: '', dic: '', ic_dph: '', country: 'Slovensko', city: 'Bratislava', street: 'Matuskova 13', zip: '844444', email: 'lanhelpdesk@test.sk', phone: '000', description: '', PricelistId: Pricelist.get('id'), monthly: false, monthlyPausal: 0, taskWorkPausal: 0, taskTripPausal: 0
  });
}


function defaultUsers(roleId, companyId) {
  return [
    {
      active: true, username: 'Laco B.', email: 'bili@test.sk', name: 'Ladislav', surname: 'Bili', password: 'Popoluska', receiveNotifications: false, signature: 'Nic', roleId, companyId, language: 'sk'
    },
    {
      active: true, username: 'Sonka S.', email: 'senk@test.sk', name: 'Sonka', surname: 'Senk', password: 'Popoluska', receiveNotifications: false, signature: 'Nic', roleId, companyId, language: 'sk'
    },
    {
      active: true, username: 'Brano S.', email: 'sus@test.sk', name: 'Brano', surname: 'Sus', password: 'Popoluska', receiveNotifications: false, signature: 'Nic', roleId, companyId, language: 'sk'
    },
  ]
}

function createFullRights() {
  let rights = {};
  ['login', 'testSections', 'mailViaComment', 'vykazy', 'publicFilters', 'addProjects', 'viewVykaz', 'viewRozpocet', 'viewErrors', 'viewInternal',
    'users', 'companies', 'pausals', 'projects', 'statuses', 'units', 'prices', 'suppliers', 'tags', 'invoices', 'roles', 'taskTypes', 'tripTypes', 'imaps', 'smtps'].forEach((right) => rights[right] = true)
  return rights;
}

export const addDefaultStatusTemplates = async () => {
  await Promise.all(
    [
      {
        title: 'New',
        order: 0,
        template: true,
        color: '#4a90e2',
        icon: 'fa fa-asterisk',
        action: 'IsNew',
      },
      {
        title: 'Open',
        order: 1,
        template: true,
        color: '#7ed321',
        icon: 'fa fa-play',
        action: 'IsOpen',
      },
      {
        title: 'Pending',
        order: 2,
        template: true,
        color: '#f6a525',
        icon: 'fa fa-pause',
        action: 'PendingDate',
      },
      {
        title: 'Closed',
        order: 3,
        template: true,
        color: '#9b9b9b',
        icon: 'fa fa-check',
        action: 'CloseDate',
      },
      {
        title: 'Invalid',
        order: 4,
        template: true,
        color: '#d0021b',
        icon: 'fa fa-times',
        action: 'CloseInvalid',
      },
    ].map((statusData) => models.Status.create(statusData))
  )
  console.log('statuses created!')
}
