import { startRest } from '@/expressREST';
import { updateModels, models } from '@/models';
import startServices from '@/services';
//import addDefaultData from '@/configs/addDefaultData';
import dotenv from 'dotenv';
dotenv.config();
const ignoreUpdating = true;

updateModels(ignoreUpdating).then(async () => {
  console.log('Database up to date, running server');
  startRest();
  startServices();
});
