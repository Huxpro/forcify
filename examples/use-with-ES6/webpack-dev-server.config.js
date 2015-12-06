/**
 * Webpack Config for Forcify Example - use with CommonJS.
 * created by @huxpro
 */

var webpack = require('webpack');
var path = require('path');
var buildPath = path.resolve(__dirname, 'build');
var nodeModulesPath = path.resolve(__dirname, 'node_modules');

var config = {

  entry: [
    path.join(__dirname, '/main.js')
  ],

  output: {
    path: buildPath,    //Path of output file
    filename: 'bundle.js'
  },

  resolve: {
    extensions: ["", ".js", ".jsx"]
    //node_modules: ["web_modules", "node_modules"]  (Default Settings)
  },

  //Server Configuration options
  devServer:{
    contentBase: '',  //Relative directory for base of server
    devtool: 'eval',
    inline: true,
    port: 3020,       //Port Number
    stats: {
        colors: true,
        cached: false,
        exclude: [/node_modules[\\\/]/]
    }
  },

  devtool: 'source-map',

  plugins: [
    //Allows error warnings but does not stop compiling. Will remove when eslint is added
    new webpack.NoErrorsPlugin(),
  ],
  module: {
    //Loaders to interpret non-vanilla javascript code as well as most other extensions including images and text.
    loaders: [
      {
        test: /\.(js|jsx)$/,  //All .js and .jsx files
        loaders: ['babel-loader?stage=0'],
        exclude: [nodeModulesPath]
      },
    ]
  },
};

module.exports = config;
