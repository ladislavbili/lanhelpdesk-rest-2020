import { Comment } from './entities/comment';
import { CommentAttachment } from './entities/commentAttachment';
import { Company } from './entities/company';
import { CustomItem } from './entities/customItem';
import { ErrorMessage } from './entities/errorMessage';
import { Filter } from './entities/filter';
import { Imap } from './entities/imap';
import { InvoicedTask } from './entities/invoicedTask';
import { Material } from './entities/material';
import { Milestone } from './entities/milestone';
import { Pricelist } from './entities/pricelist';
import { Project } from './entities/project';
import { ProjectGroup } from './entities/projectGroup';
import { Repeat } from './entities/repeat';
import { RepeatTemplate } from './entities/repeatTemplate';
import { RepeatTemplateAttachment } from './entities/repeatTemplateAttachment';
import { RepeatTime } from './entities/repeatTime';
import { Role } from './entities/role';
import { ScheduledTask } from './entities/scheduledTask';
import { ShortSubtask } from './entities/shortSubtask';
import { Smtp } from './entities/smtp';
import { Status } from './entities/status';
import { Subtask } from './entities/subtask';
import { Tag } from './entities/tag';
import { Task } from './entities/task';
import { TaskAttachment } from './entities/taskAttachment';
import { TaskChange } from './entities/taskChange';
import { TaskInvoice } from './entities/taskInvoice';
import { TasklistColumnPreference } from './entities/tasklistColumnPreference';
import { TaskMetadata } from './entities/taskMetadata';
import { TaskType } from './entities/taskType';
import { TripType } from './entities/tripType';
import { User } from './entities/user';
import { UserInvoice } from './entities/userInvoice';
import { UserNotification } from './entities/userNotification';
import { WorkTrip } from './entities/workTrip';

export default `
${Comment}
${CommentAttachment}
${Company}
${CustomItem}
${ErrorMessage}
${Filter}
${Imap}
${InvoicedTask}
${Material}
${Milestone}
${Pricelist}
${Project}
${ProjectGroup}
${Repeat}
${RepeatTemplate}
${RepeatTemplateAttachment}
${RepeatTime}
${Role}
${ScheduledTask}
${ShortSubtask}
${Smtp}
${Status}
${Subtask}
${Tag}
${Task}
${TaskAttachment}
${TaskChange}
${TaskInvoice}
${TasklistColumnPreference}
${TaskMetadata}
${TaskType}
${TripType}
${User}
${UserInvoice}
${UserNotification}
${WorkTrip}

type SecondaryTime{
  time: Float!
  source: String!
}
`;
