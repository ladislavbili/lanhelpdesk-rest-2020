import { startRest } from 'expressREST';
import { updateModels, models } from 'models';
import dotenv from 'dotenv';
dotenv.config();
const ignoreUpdating = false;

updateModels( ignoreUpdating ).then( async () => {
  console.log('Database up to date, running server');
  startRest()
});
