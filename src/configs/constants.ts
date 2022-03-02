export const testing = true;
export const production = true;
export const port = testing ? 4000 : (production ? 8080 : 8081);

const services = !testing;

export const imaps = services;
export const smtps = services;
export const repeatTasks = services;
export const useHttps = !testing;

export const refTokenLife = '10w';
export const refTokenLifeTime = 10 * 7 * 24 * 60 * 60 * 1000;
export const accTokenLife = '10d';
export const accTokenLifeTime = 10 * 24 * 60 * 60 * 1000;

export const refCookieSettings = {
  httpOnly: true,
  maxAge: refTokenLifeTime,
  path: '/',
  secure: !testing,
  sameSite: testing ? 'Lax' : 'None',
  signed: true,
}
