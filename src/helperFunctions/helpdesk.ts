import {
  RoleInstance,
} from '@/models/instances';

export const isUserAdmin = (User) => {
  return (<RoleInstance>User.get('Role')).get('level') === 0;
}
