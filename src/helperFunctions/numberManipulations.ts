export const toFloat = ( number ) => parseFloat( parseFloat( number ).toFixed( 2 ) )

export const toFloatOrZero = ( number ) => {
  return isNaN( parseFloat( number ) ) ? 0 : toFloat( number );
}