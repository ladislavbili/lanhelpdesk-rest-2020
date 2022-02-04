export const randomString = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export const capitalizeFirstLetter = (s) => {
  if (typeof s !== 'string') return ''
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

export const replaceFromString = (str, find = [], replacement = '') => {
  let newString = str;
  find.forEach((occurance) => newString = newString.replace(new RegExp(escapeRegExp(occurance), 'g'), replacement));
  return newString;
}
