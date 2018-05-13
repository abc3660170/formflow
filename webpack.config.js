const path = require("path");
const webpack = require('webpack');
const webpackConcatPlugin = require("./plugins/webpack-concat-plugin")
module.exports = {
    entry: {
        'bundle.js': [
            path.resolve(__dirname, 'index.js')
        ]
    },
    output:{
        filename:"bundle.js",
        path:path.resolve(__dirname,'dist')
    },
    node: {
        fs: "empty"
    },
    target:"web",
    plugins:[
        new webpackConcatPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NamedModulesPlugin()
    ],
    externals: {
        'js-logger':'Logger'
    },
    devServer: {
        contentBase: path.join(__dirname, "./"),
        compress: true,
        port: 9000,
        publicPath:path.resolve(__dirname,'dist')
    }
}