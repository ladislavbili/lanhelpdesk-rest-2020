import { CalendarEvent } from './entities/calendarEvent';
import { Comment } from './entities/comment';
import { Company } from './entities/company';
import { CustomItem } from './entities/customItem';
import { ErrorMessage } from './entities/errorMessage';
import { Filter } from './entities/filter';
import { Imap } from './entities/imap';
import { Material } from './entities/material';
import { Milestone } from './entities/milestone';
import { Pricelist } from './entities/pricelist';
import { Project } from './entities/project';
import { Role } from './entities/role';
import { Smtp } from './entities/smtp';
import { Status } from './entities/status';
import { Subtask } from './entities/subtask';
import { Tag } from './entities/tag';
import { Task } from './entities/task';
import { TaskChange } from './entities/taskChange';
import { TaskType } from './entities/taskType';
import { TripType } from './entities/tripType';
import { User } from './entities/user';
import { WorkTrip } from './entities/workTrip';

export default `
${CalendarEvent}
${Comment}
${Company}
${CustomItem}
${ErrorMessage}
${Filter}
${Imap}
${Material}
${Milestone}
${Pricelist}
${Project}
${Role}
${Smtp}
${Status}
${Subtask}
${Tag}
${Task}
${TaskChange}
${TaskType}
${TripType}
${User}
${WorkTrip}
`;
