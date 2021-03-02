import { startRest } from '@/expressREST';
import { updateModels, models } from '@/models';
import startServices from '@/services';
import { createTaskMetadata, addDefaultDatabaseData } from '@/helperfunctions';

import dotenv from 'dotenv';
dotenv.config();
const ignoreUpdating = true;

updateModels(ignoreUpdating).then(async () => {
  if (!ignoreUpdating) {
    console.log('Database up to date, running server');
  } else {
    console.log('Models constructed, running server');
  }
  startRest();
  startServices();
});
