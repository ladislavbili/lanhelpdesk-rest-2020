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
} from './database';

export {
  isEmail,
} from './emailCheck';

export {
  checkType,
  getAttributes
} from './expressProcessing';

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
} from './taskProcessing';

export {
  firstDateSameOrAfter,
  taskCheckDate,
  extractDatesFromObject,
  timestampToString,
  getMinutes,
} from './timeManipulations';
