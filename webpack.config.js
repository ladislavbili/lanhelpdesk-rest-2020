var webpack = require( 'webpack' );
var path = require( 'path' );
var fs = require( 'fs' );

var nodeModules = {};
fs.readdirSync( 'node_modules' )
  .filter( function( x ) {
    return [ '.bin' ].indexOf( x ) === -1;
  } )
  .forEach( function( mod ) {
    nodeModules[ mod ] = 'commonjs ' + mod;
  } );
module.exports = {
  entry: './src/index.ts',
  target: 'node',
  node: {
    __dirname: false,
  },
  output: {
    path: path.join( __dirname, 'build' ),
    filename: 'index.js'
  },
  resolve: {
    alias: {
      '@': path.resolve( __dirname, 'src/' )
    },
    extensions: [ '.ts' ],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      }
    ]
  },
  externals: nodeModules,
}