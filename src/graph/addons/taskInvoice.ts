export function toPercents(number) {
  return number / 100;
}

export function roundPoint(number, roundPoint = 2) {
  parseFloat(number.toFixed(roundPoint));
}


//Unit prices
export function getDiscountedPrice(price, discount) {
  return price * (100 - discount) / 100
}

export function getAHExtraPrice(price, discount, afterHours) {
  return getDiscountedPrice(price, discount) * (afterHours / 100);
}

export function getAHPrice(price, discount, afterHours) {
  return getDiscountedPrice(price, discount) + getAHExtraPrice(price, discount, afterHours);
}

export function getFinalPrice(price, discount, ah, afterHours = 0) {
  if (ah) {
    return getAHPrice(price, discount, afterHours)
  }
  return getDiscountedPrice(price, discount);
}

//Total prices
export function getTotalPrice(price, quantity) {
  return price * quantity;
}

export function getTotalDiscountedPrice(price, quantity, discount) {
  return getTotalPrice(price, quantity) * (100 - discount) / 100
}

export function getTotalAHExtraPrice(price, quantity, discount, afterHours) {
  return getTotalDiscountedPrice(price, quantity, discount) * afterHours / 100;
}

export function getTotalAHPrice(price, quantity, discount, afterHours) {
  return getTotalDiscountedPrice(price, quantity, discount) + getTotalAHExtraPrice(price, quantity, discount, afterHours);
}

export function getTotalFinalPrice(price, quantity, discount, ah, afterHours = 0) {
  if (ah) {
    return getTotalAHPrice(price, quantity, discount, afterHours);
  }
  return getTotalDiscountedPrice(price, quantity, discount);
}

export function getTotalFinalPriceWithDPH(price, quantity, discount, dph, ah, afterHours = 0) {
  return getTotalFinalPrice(price, quantity, discount, ah, afterHours) * (1 + parseInt(dph) / 100);
}
