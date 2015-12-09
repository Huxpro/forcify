/**
 * Webpack Config for Forcify Build.
 * created by @huxpro
 */

var webpack         = require('webpack');
var path            = require('path');
var buildPath       = path.resolve(__dirname, 'dist');
var nodeModulesPath = path.resolve(__dirname, 'node_modules');
var outputFileName  = process.env.MODE == 'dev' ?
                        "forcify.debug.js" :
                        "forcify.min.js"

var config = {

    entry: [
        path.join(__dirname, '/src/forcify.js')
    ],

    output: {
        path: buildPath,            //Path of output file
        filename: outputFileName,   //Name of output file
        library: 'Forcify',         //Library Name
        libraryTarget: 'umd'        //Target format
    },

    resolve: {
        extensions: ["", ".js", ".jsx"]
        //node_modules: ["web_modules", "node_modules"]  (Default Settings)
    },

    plugins: [
        //Minify the bundle
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false,
                drop_console: !(process.env.MODE == 'dev')
            }
        }),
        //Allows error warnings but does not stop compiling. Will remove when eslint is added
        new webpack.NoErrorsPlugin()
    ],

    module: {
        loaders: [
          {
            test: /\.(js|jsx)$/, //All .js and .jsx files
            loader: 'babel-loader?stage=0',
            exclude: [nodeModulesPath]
          }
        ]
    },
};

module.exports = config;
