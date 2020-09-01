import { Comment } from './entities/comment';
import { Company } from './entities/company';
import { CustomItem } from './entities/customItem';
import { ErrorMessage } from './entities/errorMessage';
import { Email } from './entities/email';
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
import { TaskType } from './entities/taskType';
import { TripType } from './entities/tripType';
import { User } from './entities/user';
import { WorkTrip } from './entities/workTrip';

export default `
${Comment}
${Company}
${CustomItem}
${ErrorMessage}
${Email}
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
${TaskType}
${TripType}
${User}
${WorkTrip}
`;
