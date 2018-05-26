import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import babel from 'rollup-plugin-babel';
export default [
    // browser-friendly UMD build
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
            babel({
                exclude: 'node_modules/**'
            }),
            resolve(), // so Rollup can find `ms`
            commonjs({}) // so Rollup can convert `ms` to an ES module
        ]
    }
];