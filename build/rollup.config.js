import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
import handlebars from 'rollup-plugin-handlebars-plus'
export default [
    {
        input: 'index.js',
        output: {
            name: 'bundle',
            file: "dist/bundle.js",
            format: 'iife'
        },
        external:[
            "jquery",
            'js-logger'
        ],
        globals: {
            jquery: '$',
            'js-logger': 'Logger'
        },
        plugins: [
            handlebars({
                templateExtension: '.handlebars'
            }),
            babel({
                exclude: 'node_modules/**'
            }),
            resolve(), // so Rollup can find `ms`
            commonjs() // so Rollup can convert `ms` to an ES module
        ]
    }
];