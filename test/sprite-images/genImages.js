let Spritesmith = require('spritesmith');
let glob = require('glob');
let fs = require('fs');
let fsExtra = require('fs-extra');
let Logger = require('js-logger')
let mkdirp = require('mkdirp')

Logger.useDefaults();
const
    HOVER_FLAG = '-hover',
    CURRENT_FLAG = '-current',
    DISABLED_FLAG = '-disabled';
function gen4state(inputFolder,outputFolder,options,callback) {
    glob(`${inputFolder}/**/+(*.png|*.jpg)`,{"ignore":[`${inputFolder}/**/+(*${HOVER_FLAG}.*|*${CURRENT_FLAG}.*|*${DISABLED_FLAG}.*)`]},(error,files) => {
        if (error)
            throw error;
        if(files.length === 0)
            Logger.warn(`${inputFolder}目录下没有图片！`)
        // clean dest folders
        fsExtra.emptyDir(outputFolder)
            .then(() => {
                // find default state image exclude hover 、current、disabled
                let defaultFiles = [],
                    hoverFiles   = [],
                    currentFiles = [],
                    disabledFiles= [];
                defaultFiles = files;
                //console.log(files)
                // check if some images all states numbers < 4 fill up all other state
                defaultFiles.forEach((imageDefault) => {
                    let noExtFile = /(.*)\./.exec(imageDefault)[1];
                    let ext = /\.(.+)/.exec(imageDefault)[1]
                    let expectedHover = `${noExtFile}${HOVER_FLAG}.${ext}`,
                        expectedCurrent = `${noExtFile}${CURRENT_FLAG}.${ext}`,
                        expectedDisabled = `${noExtFile}${DISABLED_FLAG}.${ext}`;

                    // fillup hover file
                    if(!fs.existsSync(expectedHover)){
                        hoverFiles.push(imageDefault)
                    }else{
                        hoverFiles.push(expectedHover)
                    }

                    // fillup current file
                    if(!fs.existsSync(expectedCurrent)){
                        currentFiles.push(imageDefault)
                    }else{
                        currentFiles.push(expectedCurrent)
                    }

                    // fillup disabled file
                    if(!fs.existsSync(expectedDisabled)){
                        disabledFiles.push(imageDefault)
                    }else{
                        disabledFiles.push(expectedDisabled)
                    }
                })
                //generate all four state sprite images
                let genImageByState = function(files,output) {
                    return new Promise((resolve,reject) => {
                        Spritesmith.run({src:files},(error,result) => {
                            if(error)
                                return reject(error);
                            if(Object.keys(result.coordinates).length !== 0){
                                mkdirp(/(.*)[\/\\]/.exec(output)[1],(error) => {
                                    if(error)
                                        return reject(error)
                                    fs.writeFile(output,result.image,(error) => {
                                        if(error)
                                            return reject(error)
                                        resolve(result)
                                    })
                                })
                            }

                        })
                    })
                }
                Promise.all([
                    genImageByState(defaultFiles,`${outputFolder}/${options.baseName}.png`),
                    genImageByState(hoverFiles,`${outputFolder}/${options.baseName}_hover.png`),
                    genImageByState(currentFiles,`${outputFolder}/${options.baseName}_current.png`),
                    genImageByState(disabledFiles,`${outputFolder}/${options.baseName}_disabled.png`)
                ])
                    .then(() => {
                        callback()
                    },(error) => {
                        //throw error;
                        callback(error)
                    })
                    .catch(function(error){
                        Logger.error(error)
                    })
            })
            .catch((error) =>{
                throw error;
            })

    })
}

module.exports.gen4state = gen4state;