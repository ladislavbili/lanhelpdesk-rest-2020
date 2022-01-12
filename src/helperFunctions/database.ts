import {
  models
} from '@/models';
import { hash } from 'bcrypt';
import { randomString } from '@/helperFunctions';
import {
  TaskInstance,
  ProjectInstance,
  ProjectGroupInstance,
  CompanyInstance,
  CompanyDefaultsInstance,
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
  await models.CompanyDefaults.create({ dph: 20 });
  return models.Company.create({
    title: 'LanHelpdesk Team', dph: '20', ico: '', dic: '', ic_dph: '', country: 'Slovensko', city: 'Bratislava', street: 'Matuskova 13', zip: '844444', email: 'lanhelpdesk@test.sk', phone: '000', description: '', PricelistId: Pricelist.get('id'), monthly: false, monthlyPausal: 0, taskWorkPausal: 0, taskTripPausal: 0, def: true,
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
    'users', 'companies', 'pausals', 'projects', 'statuses', 'units', 'prices', 'suppliers', 'tags', 'invoices', 'roles', 'taskTypes', 'tripTypes', 'imaps', 'smtps', 'tasklistLayout', 'tasklistCalendar', 'tasklistPreferences', 'customFilters', 'lanwiki'].forEach((right) => rights[right] = true)
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
}

export const addAttributesToProjects = async () => {
  const Projects = <any[]>await models.Project.findAll({ include: [models.ProjectAttributes] });
  if (Projects.filter((Project) => !Project.get('ProjectAttribute')).length !== 0) {
    await Promise.all(Projects.filter((Project) => !Project.get('ProjectAttribute')).map((Project) => Project.createProjectAttribute()));
    console.log('all projects have attributes');
  } else {
    console.log('No need for update, all projects have attributes');
  }
}

const expectedGroups = {
  admin: {
    order: 0,
    def: true,
    admin: true,
    title: 'Admin',
    description: 'Default admin group'
  },
  agent: {
    order: 1,
    def: true,
    admin: false,
    title: 'Agent',
    description: 'Default agent group'
  },
  customer: {
    order: 2,
    def: true,
    admin: false,
    title: 'Customer',
    description: 'Default customer group'
  },

}

const compareModelInstanceToObject = (modelInstance, object) => {
  return Object.keys(object).every((key) => object[key] === modelInstance.get(key));
}

export const createFixedGroupsForProjects = async () => {
  const Projects = <ProjectInstance[]>await models.Project.findAll({ include: [models.ProjectGroup] });
  const FailingProjects = Projects.filter((Project) => {
    const ProjectGroups = <ProjectGroupInstance[]>Project.get('ProjectGroups');
    const AdminProjectGroup = ProjectGroups.find((ProjectGroup) => compareModelInstanceToObject(ProjectGroup, expectedGroups.admin));
    const AgentProjectGroup = ProjectGroups.find((ProjectGroup) => compareModelInstanceToObject(ProjectGroup, expectedGroups.agent));
    const CustomerProjectGroup = ProjectGroups.find((ProjectGroup) => compareModelInstanceToObject(ProjectGroup, expectedGroups.customer));
    return (
      ProjectGroups.some((ProjectGroup) => (
        ProjectGroup.get('def') &&
        (!AdminProjectGroup || ProjectGroup.get('id') !== AdminProjectGroup.get('id')) &&
        (!AgentProjectGroup || ProjectGroup.get('id') !== AgentProjectGroup.get('id')) &&
        (!CustomerProjectGroup || ProjectGroup.get('id') !== CustomerProjectGroup.get('id'))
      )) ||
      !AdminProjectGroup ||
      !AgentProjectGroup ||
      !CustomerProjectGroup
    );
  });
  if (FailingProjects.length === 0) {
    console.log('No need for update, all projects have default groups OK.');
    return;
  }

  await Promise.all(
    Projects.reduce((acc, Project) => {

      let promises = [];
      let updatedGroups = [];
      const ProjectGroups = <ProjectGroupInstance[]>Project.get('ProjectGroups');
      let GroupsToFix = ProjectGroups.filter((ProjectGroup) => (
        ProjectGroup.get('def') &&
        (!AdminProjectGroup || ProjectGroup.get('id') !== AdminProjectGroup.get('id')) &&
        (!AgentProjectGroup || ProjectGroup.get('id') !== AgentProjectGroup.get('id')) &&
        (!CustomerProjectGroup || ProjectGroup.get('id') !== CustomerProjectGroup.get('id'))
      ));

      let AdminProjectGroup = ProjectGroups.find((ProjectGroup) => compareModelInstanceToObject(ProjectGroup, expectedGroups.admin));
      let hasCorrectAdmin = AdminProjectGroup !== undefined;
      let AgentProjectGroup = ProjectGroups.find((ProjectGroup) => compareModelInstanceToObject(ProjectGroup, expectedGroups.agent));
      let hasCorrectAgent = AdminProjectGroup !== undefined;
      let CustomerProjectGroup = ProjectGroups.find((ProjectGroup) => compareModelInstanceToObject(ProjectGroup, expectedGroups.customer));
      let hasCorrectCustomer = AdminProjectGroup !== undefined;
      //ak nieje admin, skus najst admina, daj mu def aj admin, ak neexistuje, vytvor rolu admina
      if (!AdminProjectGroup) {
        AdminProjectGroup = ProjectGroups.find((ProjectGroup) => ProjectGroup.get('def') && ProjectGroup.get('admin'));
      }
      if (!AdminProjectGroup) {
        AdminProjectGroup = ProjectGroups.find((ProjectGroup) => ProjectGroup.get('admin'));
      }
      if (!AdminProjectGroup) {
        AdminProjectGroup = ProjectGroups.find((ProjectGroup) => ProjectGroup.get('title') === 'Admin');
      }
      if (!AdminProjectGroup) {
        AdminProjectGroup = ProjectGroups.find((ProjectGroup) => ProjectGroup.get('title').toLowerCase().includes('admin'));
      }
      if (!hasCorrectAdmin) {
        if (AdminProjectGroup) {
          promises.push(AdminProjectGroup.update(expectedGroups.admin));
          GroupsToFix = GroupsToFix.filter((Group) => Group.get('id') !== AdminProjectGroup.get('id'));
        } else {
          promises.push(Project.createProjectGroup(
            {
              ...expectedGroups.admin,
              ProjectGroupRight: {
                projectRead: true,
                projectWrite: true,
                companyTasks: true,
                allTasks: true,
              },
            },
            {
              include: [models.ProjectGroupRights]
            }
          ));

        }
      }

      if (!AgentProjectGroup) {
        AgentProjectGroup = ProjectGroups.find((ProjectGroup) => ProjectGroup.get('title') === 'Agent' && ProjectGroup.get('def'));
      }
      if (!AgentProjectGroup) {
        AgentProjectGroup = ProjectGroups.find((ProjectGroup) => ProjectGroup.get('title').toLowerCase().includes('agent') && ProjectGroup.get('def'));
      }
      if (!AgentProjectGroup) {
        AgentProjectGroup = ProjectGroups.find((ProjectGroup) => ProjectGroup.get('title') === 'Agent');
      }
      if (!AgentProjectGroup) {
        AgentProjectGroup = ProjectGroups.find((ProjectGroup) => ProjectGroup.get('title').toLowerCase().includes('agent'));
      }

      if (!hasCorrectAgent) {
        if (AgentProjectGroup) {
          promises.push(AgentProjectGroup.update(expectedGroups.agent));
          GroupsToFix = GroupsToFix.filter((Group) => Group.get('id') !== AgentProjectGroup.get('id'));
        } else {
          promises.push(Project.createProjectGroup(
            {
              ...expectedGroups.agent,
              ProjectGroupRight: {
                projectRead: false,
              },
            },
            {
              include: [models.ProjectGroupRights]
            }
          ));
        }
      }

      if (!CustomerProjectGroup) {
        CustomerProjectGroup = ProjectGroups.find((ProjectGroup) => ProjectGroup.get('title') === 'Customer' && ProjectGroup.get('def'));
      }
      if (!CustomerProjectGroup) {
        CustomerProjectGroup = ProjectGroups.find((ProjectGroup) => ProjectGroup.get('title').toLowerCase().includes('customer') && ProjectGroup.get('def'));
      }
      if (!CustomerProjectGroup) {
        CustomerProjectGroup = ProjectGroups.find((ProjectGroup) => ProjectGroup.get('title') === 'Customer');
      }
      if (!CustomerProjectGroup) {
        CustomerProjectGroup = ProjectGroups.find((ProjectGroup) => ProjectGroup.get('title').toLowerCase().includes('customer'));
      }

      if (!hasCorrectCustomer) {
        if (CustomerProjectGroup) {
          promises.push(CustomerProjectGroup.update(expectedGroups.customer));
          GroupsToFix = GroupsToFix.filter((Group) => Group.get('id') !== CustomerProjectGroup.get('id'));
        } else {
          promises.push(Project.createProjectGroup(
            {
              ...expectedGroups.customer,
              ProjectGroupRight: {
                projectRead: false,
              },
            },
            {
              include: [models.ProjectGroupRights]
            }
          ));
        }
      }
      promises.push(GroupsToFix.map((Group) => Group.update({ def: false, admin: false })))
      return [...acc, ...promises];
    }, [])
  );
  console.log('all projects were updated to have default groups.');
}

export const createDefCompanyDataIfDoesntExists = async () => {
  const DefCompanies = <CompanyInstance[]>await models.Company.findAll();
  if (!DefCompanies.some((Company) => Company.get('def'))) {
    console.log('Missing def company');
    if (DefCompanies.length === 0) {
      console.log('no companies');
    } else {
      DefCompanies[0].update({ def: true })
    }
  } else {
    console.log('Def company exists');
  }
  const CompanyDefaults = <CompanyDefaultsInstance[]>await models.CompanyDefaults.findAll();
  if (CompanyDefaults.length === 0) {
    console.log('No company def values, creating');
    await models.CompanyDefaults.create({ dph: 20 })
    console.log('Created def values');
  } else {
    console.log('Def company values exists');
  }
}

/* QUICK OLD FIXES
GIVE INVOICED THINGS THEIR PRICE
//has to have DEF company
const subtasksToFix = <any[]>await models.Subtask.findAll({
  where: { invoiced: true, invoicedPrice: null }, include: [{
    model: models.Task,
    attributes: ['id', 'TaskTypeId', 'overtime'],
    include: [{
      model: models.Company,
      attributes: ['id'],
      include: [{
        model: models.Pricelist,
        attributes: ['id', 'afterHours'],
        include: [models.Price]
      }]
    }]
  }]
});
subtasksToFix.forEach((Subtask) => {
  const type = Subtask.get('Task').get('TaskTypeId');
  const prices = Subtask.get('Task').get('Company').get('Pricelist').get('Prices');
  const price = prices.find((price) => price.type = "TaskType" && price.get('TaskTypeId') === type).get('price');
  Subtask.update({
    invoicedPrice: Math.round(((
      parseFloat(price) *
      (Subtask.get('Task').get('overtime') ? (parseFloat(Subtask.get('Task').get('Company').get('Pricelist').get('afterHours')) / 100 + 1) : 1) *
      ((100 - parseFloat(Subtask.get('discount'))) / 100)
    ) + Number.EPSILON) * 100) / 100
  })
});
*/
