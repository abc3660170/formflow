const path = require("path");
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
module.exports = {
    entry: {
        bundle: path.resolve(__dirname, '../index.js')
    },
    output:{
        filename:"bundle.js",
        path:path.resolve(__dirname,'../dist')
    },
    node: {
        fs: "empty"
    },
    target:"web",
    devServer: {
        contentBase: './',
        host:"0.0.0.0"
    },
    plugins:[
       // new webpackConcatPlugin(),
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            title: 'Hot Module Replacement',
            template: 'examples/formflow/index.html'
        }),
        new webpack.NamedModulesPlugin(),
        new webpack.HotModuleReplacementPlugin()
    ],
    externals: {
        'js-logger':'Logger',
        'jquery':'jQuery'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: 'babel-loader'
                }
            },{
                test:/\.handlebars$/,
                loader:'handlebars-loader',
                query:{
                    helperDirs:[
                        path.resolve(__dirname,"../src/hbs_helpers")
                    ]
                }
            }
        ]
    }
}