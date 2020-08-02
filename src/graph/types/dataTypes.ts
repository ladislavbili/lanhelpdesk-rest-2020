import { Company } from './entities/company';
import { ErrorMessage } from './entities/errorMessage';
import { Imap } from './entities/imap';
import { Pricelist } from './entities/pricelist';
import { Project } from './entities/project';
import { Role } from './entities/role';
import { Smtp } from './entities/smtp';
import { Status } from './entities/status';
import { Tag } from './entities/tag';
import { Task } from './entities/task';
import { TaskType } from './entities/taskType';
import { TripType } from './entities/tripType';
import { User } from './entities/user';

export default `
${Company}
${ErrorMessage}
${Imap}
${Pricelist}
${Project}
${Role}
${Smtp}
${Status}
${Tag}
${Task}
${TaskType}
${TripType}
${User}
`;
