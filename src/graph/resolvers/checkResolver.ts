import { models } from 'models';
import { InvalidTokenError, NoAccTokenError, MutationOrResolverAccessDeniedError } from 'configs/errors';
import { verifyAccToken } from 'configs/jwt';
import { UserInstance } from 'models/interfaces';

export default async function checkResolver( req, access = [] ){
  const token = req.headers.authorization as String;
  if( !token ){
    throw NoAccTokenError;
  }
  let userData = null;
  try{
    userData = await verifyAccToken( token.replace('Bearer ',''), models.User );
  }catch(error){
    throw InvalidTokenError;
  }
  const user = await <UserInstance> models.User.findByPk(userData.id);
  const role = await user.getRole();
  const rules = (await role.getAccessRight());

  if( access.every( (rule) => rules[rule] && typeof rules[rule] === "boolean" ) ){
    return;
  }
  throw MutationOrResolverAccessDeniedError;
}
