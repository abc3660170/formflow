const path = require("path");
const webpack = require('webpack');
const webpackConcatPlugin = require("./plugins/webpack-concat-plugin")
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
module.exports = {
    entry: {
        bundle: path.resolve(__dirname, 'index.js')
    },
    output:{
        filename:"bundle.js",
        path:path.resolve(__dirname,'dist')
    },
    node: {
        fs: "empty"
    },
    target:"web",
    devServer: {
        contentBase: './'
    },
    plugins:[
       // new webpackConcatPlugin(),
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            title: 'Hot Module Replacement',
            template: 'demo/index.html'
        }),
        new webpack.NamedModulesPlugin(),
        new webpack.HotModuleReplacementPlugin()
    ],
    externals: {
        'js-logger':'Logger',
        'jquery':'jQuery'
    }
}