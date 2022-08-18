import { startRest } from '@/expressREST';
import { updateModels, models } from '@/models';
import startServices from '@/services';
import { createTaskMetadata, addDefaultDatabaseData, addAttributesToProjects, createFixedGroupsForProjects, logWithDate, createDefCompanyDataIfDoesntExists } from '@/helperFunctions';

import dotenv from 'dotenv';
dotenv.config();
const ignoreUpdating = true;

updateModels(ignoreUpdating).then(async () => {
  if (!ignoreUpdating) {
    logWithDate('Database up to date, running server');
  } else {
    logWithDate('Models constructed, running server');
  }
  startRest();
  startServices();
  //addDefaultDatabaseData();
});
