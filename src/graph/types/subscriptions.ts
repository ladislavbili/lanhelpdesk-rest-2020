import { TaskSubscriptions } from './entities/task';

export default `
type Subscription {
  ${TaskSubscriptions}
}
`
