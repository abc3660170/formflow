const fs = require("fs")
const path = require("path")
const concat = require("concat")
function webpackLinkFiles(options){

}

webpackLinkFiles.prototype.apply = function(compiler){
    compiler.hooks.done.tap("webpackLinkFiles",function(compilation){
        concat(['./lib/logger.js','./dist/bundle.js'],"./dist/bundle.js")
    })
}

module.exports = webpackLinkFiles