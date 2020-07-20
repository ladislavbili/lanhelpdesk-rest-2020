import { Company } from './entities/company';
import { Pricelist } from './entities/pricelist';
import { Role } from './entities/role';
import { Tag } from './entities/tag';
import { Task } from './entities/task';
import { TaskType } from './entities/taskType';
import { TripType } from './entities/tripType';
import { User } from './entities/user';

export default `
${Company}
${Pricelist}
${Role}
${Tag}
${Task}
${TaskType}
${TripType}
${User}
`;
