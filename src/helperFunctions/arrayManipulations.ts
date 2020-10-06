export const splitArrayByFilter = (array, filter) => {
  return array.reduce(([p, f], e) => (filter(e) ? [[...p, e], f] : [p, [...f, e]]), [[], []]);
}

export const filterUnique = (array, key = null) => {
  if (key === null) {
    return array.filter((item, index) => array.indexOf(item) === index);
  } else {
    let keys = array.map((item) => item[key]);
    return array.filter((item, index) => keys.indexOf(item[key]) === index);
  }
}
