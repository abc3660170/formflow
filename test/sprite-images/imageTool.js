let Spritesmith = require('spritesmith');
let glob = require('glob');
let fs = require('fs');
let path = require('path')
let fsExtra = require('fs-extra');
let Logger = require('js-logger')
let mkdirp = require('mkdirp')

Logger.useDefaults();
const
    HOVER_FLAG = '-hover',
    CURRENT_FLAG = '-current',
    DISABLED_FLAG = '-disabled';
function genImages(inputFolder,outputFolder,options) {
    return new Promise((resolve,reject) => {
        glob(`${inputFolder}/**/+(*.png|*.jpg)`,{"ignore":[`${inputFolder}/**/+(*${HOVER_FLAG}.*|*${CURRENT_FLAG}.*|*${DISABLED_FLAG}.*)`]},(error,files) => {
            if (error)
                throw error;
            if(files.length === 0)
                return reject(`${inputFolder}目录下没有图片！`);
            // clean dest folders
            Logger.log("清理输出目录... ",outputFolder)
            fsExtra.emptyDir(outputFolder).then(() => {
                return new Promise((resolve,reject) => {
                    // extract images from options.extend
                    glob(`${options.extend}/**/+(*.png|*.jpg)`,{"ignore":[`${options.extend}/**/+(*${HOVER_FLAG}.*|*${CURRENT_FLAG}.*|*${DISABLED_FLAG}.*)`]},(error,filesExtend) => {
                        if (error)
                            throw error;
                        if(files.length === 0)
                            return reject(`${inputFolder}被继承的主题目录下没有图片！`);
                        for( let i = 0; i < filesExtend.length; i++){
                            files.forEach(file => {
                                if(file.replace(inputFolder,"") === filesExtend[i].replace(options.extend,"")){
                                    filesExtend[i] = file
                                }
                            })
                        }
                        resolve(filesExtend)
                    })
                })
            }).then((files) => {
                Logger.log("目录已经清理完毕",outputFolder)
                // find default state image exclude hover 、current、disabled
                let defaultFiles = [],
                    hoverFiles   = [],
                    currentFiles = [],
                    disabledFiles= [];

                let defaultOutputImageName = `${options.baseName}.png`,
                    hoverOutputImageName = `${options.baseName}_hover.png`,
                    currentOutputImageName = `${options.baseName}_current.png`,
                    disabledOutputImageName = `${options.baseName}_disabled.png`;

                let defaultOutputImageFile = `${outputFolder}/${options.imgSrc}/${defaultOutputImageName}`,
                    hoverOutputImageFile = `${outputFolder}/${options.imgSrc}/${hoverOutputImageName}`,
                    currentOutputImageFile = `${outputFolder}/${options.imgSrc}/${currentOutputImageName}`,
                    disabledOutputImageFile = `${outputFolder}/${options.imgSrc}/${disabledOutputImageName}`;

                let cssOutputFile = `${outputFolder}/${options.cssSrc}/${options.baseName}.css`;


                defaultFiles = files;

                // check if some images all states numbers < 4 fill up all other state
                Logger.log("开始对齐4状态图标...",outputFolder)
                let fileCheckerrorMsg = [];
                defaultFiles.forEach((imageDefault) => {
                    imageDefaultName = imageDefault.substring(imageDefault.lastIndexOf('/') + 1);
                    if(/[A-Z]/.test(imageDefaultName))
                        fileCheckerrorMsg.push(`${imageDefault}文件格式不对！`)
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
                Logger.log(`状态图标已经对其，共${defaultFiles.length}个文件`,outputFolder)

                if(fileCheckerrorMsg.length > 0)
                    return reject(fileCheckerrorMsg.join("\n"))

                let cssSpriteStyle;
                let stylesheet = "";
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
                            if(files === defaultFiles){
                                cssSpriteStyle = result.coordinates;
                            }
                        })
                    })
                }
                Logger.log(`开始向${outputFolder}中输出文件...`)
                Promise.all([
                    genImageByState(defaultFiles,defaultOutputImageFile),
                    genImageByState(hoverFiles,hoverOutputImageFile),
                    genImageByState(currentFiles,currentOutputImageFile),
                    genImageByState(disabledFiles,disabledOutputImageFile)
                ]).then(() => {
                    Logger.log(`向${outputFolder}中输出文件完成`)
                    return new Promise((resolve,reject) => {
                        let relativeImagePath = path.relative(/(.+)\//.exec(cssOutputFile)[1],/(.+)\//.exec(defaultOutputImageFile)[1]).replace(/\\/g,'/');
                        stylesheet += `.${options.parentClassName} { display:inline-block; background-image:url("${relativeImagePath}/${defaultOutputImageName}")}\n`
                        Object.keys(cssSpriteStyle).forEach(key => {
                            let ClassObject = cssSpriteStyle[key];
                            let className = /([^\/]+\/?[^\/]+)\./.exec(key)[1].replace(/\//g,'-');
                            stylesheet += `.${options.parentClassName}.${className} {width: ${ClassObject.width}px; height: ${ClassObject.height}px; background-position:-${ClassObject.x}px -${ClassObject.y}px; }\n`
                        })
                        mkdirp(/(.*)[\/\\]/.exec(cssOutputFile)[1],(error) => {
                            if(error)
                                return reject(error)
                            fs.writeFile(cssOutputFile,stylesheet,(error) => {
                                if(error)
                                    return reject(error)
                                resolve()
                            })
                        })
                    })
                },(error) => {
                    //throw error;
                    reject(error)
                }).catch(function(error){
                    // handle gen images exception
                    Logger.error(error)
                })
            },(error) => {
                reject(error)
            }).catch((error) =>{
                Logger.error(error)
            })
        })
    });
}

module.exports.genImages = genImages;