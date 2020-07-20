import { sign, verify } from 'jsonwebtoken';
import jwt_decode from 'jwt-decode';
import { InvalidTokenError } from './errors';

function createPass(pass, user, loginKey){
  return `${pass} ${user.password.substring( user.password.length - 5 )}${user.email}${user.active}${loginKey}`
}

export async function createAccessToken( user, loginKey ){

  let userData = (await user.get());
  return sign(
    { id: userData.id, loginKey },
    createPass(process.env.JWT_ACC_PASS, userData, loginKey ),
    { expiresIn: '10d' }
  )
}

export async function createRefreshToken( user, loginKey ){
  let userData = (await user.get());
  return sign(
    { id: userData.id, loginKey },
    createPass(process.env.JWT_REF_PASS, userData, loginKey ),
    { expiresIn: '7d' }
  )
}

export async function verifyAccToken( token, UserModel ){
  let userData = jwt_decode(token);

  const user = await UserModel.findByPk(userData.id);
  const loginKeys = await user.getTokens();
  if( !loginKeys.some((key) => key.key === userData.loginKey ) ){
    throw InvalidTokenError;
  }
  return verify(token, createPass( process.env.JWT_ACC_PASS, user.get(), userData.loginKey ))
}

export async function verifyRefToken( token, UserModel ){
  let userData = jwt_decode(token);

  const user = await UserModel.findByPk(userData.id);
  const loginKeys = await user.getTokens();
  if( !loginKeys.some((key) => key.key === userData.loginKey ) ){
    throw InvalidTokenError;
  }

  return verify(token, createPass( process.env.JWT_REF_PASS, user.get(), userData.loginKey ))
}
