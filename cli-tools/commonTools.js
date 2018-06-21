let fs = require('fs');
function formatUrl(url){
    return /^.+[^\/\\]/.exec(url.replace(/\\/g,"/"))[0]
}

function deleteFiles(files, callback){
    var i = files.length;
    files.forEach(function(filepath){
        fs.unlink(filepath, function(err) {
            i--;
            if (err && err.errno !== -4058) {
                callback(err);
                return;
            } else if (i <= 0) {
                callback(null);
            }
        });
    });
}
module.exports.formatUrl = formatUrl;
module.exports.deleteFiles = deleteFiles;