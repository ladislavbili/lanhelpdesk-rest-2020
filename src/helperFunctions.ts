export const randomString =  () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

export const loadObjectWithValues = () => {

}

export const splitArrayByFilter = (array, filter) => {
  return array.reduce(([p, f], e) => (filter(e) ? [[...p, e], f] : [p, [...f, e]]), [[], []]);
}
