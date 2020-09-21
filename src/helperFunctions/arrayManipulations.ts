export const splitArrayByFilter = (array, filter) => {
  return array.reduce(([p, f], e) => (filter(e) ? [[...p, e], f] : [p, [...f, e]]), [[], []]);
}
