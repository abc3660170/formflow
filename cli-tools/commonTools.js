function formatUrl(url){
    return /^.+[^\/\\]/.exec(url.replace(/\\/g,"/"))[0]
}

module.exports.formatUrl = formatUrl;