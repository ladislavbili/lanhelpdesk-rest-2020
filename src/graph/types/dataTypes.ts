import { Comment } from './entities/comment';
import { CommentAttachment } from './entities/commentAttachment';
import { Company } from './entities/company';
import { CustomItem } from './entities/customItem';
import { ErrorMessage } from './entities/errorMessage';
import { Filter } from './entities/filter';
import { Imap } from './entities/imap';
import { InvoiceCompany } from './entities/invoiceCompany';
import { Material } from './entities/material';
import { Milestone } from './entities/milestone';
import { Pricelist } from './entities/pricelist';
import { Project } from './entities/project';
import { ProjectAttributes } from './entities/projectAttributes';
import { ProjectAttachment } from './entities/projectAttachment';
import { ProjectGroup } from './entities/projectGroup';
import { Repeat } from './entities/repeat';
import { RepeatTemplate } from './entities/repeatTemplate';
import { RepeatTemplateAttachment } from './entities/repeatTemplateAttachment';
import { RepeatTime } from './entities/repeatTime';
import { Role } from './entities/role';
import { ScheduledWork } from './entities/scheduledWork';
import { ShortSubtask } from './entities/shortSubtask';
import { Smtp } from './entities/smtp';
import { Status } from './entities/status';
import { Subtask } from './entities/subtask';
import { Tag } from './entities/tag';
import { Task } from './entities/task';
import { TaskAttachment } from './entities/taskAttachment';
import { TaskChange } from './entities/taskChange';
import { TasklistColumnPreference } from './entities/tasklistColumnPreference';
import { TasklistGanttColumnPreference } from './entities/tasklistGanttColumnPreference';
import { TasklistSort } from './entities/tasklistSort';
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
${InvoiceCompany}
${Material}
${Milestone}
${Pricelist}
${Project}
${ProjectAttributes}
${ProjectAttachment}
${ProjectGroup}
${Repeat}
${RepeatTemplate}
${RepeatTemplateAttachment}
${RepeatTime}
${Role}
${ScheduledWork}
${ShortSubtask}
${Smtp}
${Status}
${Subtask}
${Tag}
${Task}
${TaskAttachment}
${TaskChange}
${TasklistColumnPreference}
${TasklistGanttColumnPreference}
${TasklistSort}
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
