export {
  addApolloError,
  addError,
} from './addErrorMessage';

export {
  splitArrayByFilter,
  filterUnique,
} from './arrayManipulations';

export {
  createExecClass,
} from './benchmark';

export {
  createTaskMetadata,
  addDefaultDatabaseData,
  addUser,
  addDefaultStatusTemplates,
  addAttributesToProjects,
  createFixedGroupsForProjects,
  createDefCompanyDataIfDoesntExists,
} from './database';

export {
  isEmail,
} from './emailCheck';

export {
  checkType,
  getAttributes
} from './expressProcessing';

export {
  isUserAdmin,
} from './helpdesk';

export {
  logFunctionsOfModel,

  idDoesExists,
  idsDoExists,
  multipleIdDoesExists,

  idDoesExistsCheck,
  idsDoExistsCheck,
  multipleIdDoesExistsCheck,
} from './modelChecks';

export {
  sendTaskNotificationsToUsers,
  allNotificationMessages,
  sendNotification,
} from './notifications';

export {
  toFloat,
  toFloatOrZero
}
  from './numberManipulations';

export {
  flattenObject,
} from './objectManipulations';

export {
  getModelAttribute,
  mergeFragmentedModel,
} from './sequelizeFunctions';

export {
  randomString,
  capitalizeFirstLetter,
} from './stringManipulations';

export {
  createChangeMessage,
  createTaskAttributesChangeMessages,
  createTaskAttributesNotifications,
} from './taskProcessing';

export {
  firstDateSameOrAfter,
  taskCheckDate,
  extractDatesFromObject,
  timestampToString,
  getMinutes,
  logWithDate,
} from './timeManipulations';
