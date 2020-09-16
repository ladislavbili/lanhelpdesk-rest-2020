import { hash } from 'bcrypt';
import { models } from '@/models';
import { randomString } from '@/helperFunctions';

export default async function addDefaultData() {
  /*
  await models.Role.truncate({cascade: true});
  await models.Company.truncate({cascade: true});
  await models.User.truncate({cascade: true});
  */
  const Role = await createRole();
  const Company = await createCompany();
  defaultUsers(Role.get('id'), Company.get('id')).forEach((user) => addUser(user));
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
    title: 'Lanhelpdesk team pricelist', order: '1', afterHours: 4, def: true, materialMargin: 10, materialMarginExtra: 20
  });

  return models.Company.create({
    title: 'LanHelpdesk Team', dph: '20', ico: '', dic: '', ic_dph: '', country: 'Slovensko', city: 'Bratislava', street: 'Matuskova 13', zip: '844444', email: 'lanhelpdesk@test.sk', phone: '000', description: '', pricelistId: Pricelist.get('id'), monthly: false, monthlyPausal: 0, taskWorkPausal: 0, taskTripPausal: 0
  });
}

async function addUser({ password, roleId, companyId, language, ...targetUserData }) {
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
