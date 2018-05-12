const path = require("path");
module.exports = {
    entry:["../lib/logger.js","./src/Formflow.js"],
    output:{
        filename:"bundle.js",
        path:path.resolve(__dirname,'dist')
    },
    node: {
        fs: "empty"
    }
}