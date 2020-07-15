import { models } from 'models';
import { InvalidTokenError, NoAccTokenError, MutationOrResolverAccessDeniedError, UserDeactivatedError } from 'configs/errors';
import { verifyAccToken } from 'configs/jwt';
import { UserInstance } from 'models/interfaces';
import { sequelize } from 'models';

export default async function checkResolver( req, access = [] ){
  const token = req.headers.authorization as String;

  if( !token ){
    throw NoAccTokenError;
  }
  let userData = null;
  try{
    userData = await verifyAccToken( token.replace('Bearer ',''), models.User );
  }catch(error){
    sequelize.query("DELETE FROM tokens WHERE expiresAt < NOW()");
    throw InvalidTokenError;
  }
  const User = await <UserInstance> models.User.findByPk(userData.id, { include: [{ model: models.Role, include:[{ model: models.AccessRights }] }] });

  if( User.get('active') === false ){
    throw UserDeactivatedError;
  }

  const rules = User.get('Role').get('AccessRight');

  if( [ ...access, 'login' ].every( (rule) => rules[rule] && typeof rules[rule] === "boolean" ) ){
    const Token = await models.Token.findOne({ where: { key: userData.loginKey, UserId: userData.id } })
    let expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    await Token.update({expiresAt});
    return User;
  }
  throw MutationOrResolverAccessDeniedError;
}
