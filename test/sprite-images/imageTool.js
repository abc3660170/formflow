let Spritesmith = require('spritesmith');
let glob = require('glob');
let fs = require('fs');
let path = require('path')
let fsExtra = require('fs-extra');
let Logger = require('js-logger')
let mkdirp = require('mkdirp')
let tools = require("../../cli-tools/commonTools");

Logger.useDefaults();
const
    HOVER_FILE_FLAG    = '-hover',
    CURRENT_FILE_FLAG  = '-current',
    DISABLED_FILE_FLAG = '-disabled';
const
    DEFAULT_CLASS  = 'hc-default',
    HOVER_CLASS    = 'hc-hover',
    CURRENT_CLASS  = 'hc-current',
    DISABLED_CLASS = 'hc-disabled';
function genImages(inputFolder,outputFolder,options) {
    return new Promise((resolve,reject) => {
        inputFolder = tools.formatUrl(inputFolder);
        outputFolder = tools.formatUrl(outputFolder);
        options.extend = tools.formatUrl(options.extend);
        glob(`${inputFolder}/**/+(*.png|*.jpg)`,{"ignore":[`${inputFolder}/**/+(*${HOVER_FILE_FLAG}.*|*${CURRENT_FILE_FLAG}.*|*${DISABLED_FILE_FLAG}.*)`]},(error,files) => {
            if (error)
                throw error;
            if(files.length === 0)
                return reject(`${inputFolder}目录下没有图片！`);
            // clean dest folders
            Logger.log("清理输出目录... ",outputFolder)
            fsExtra.emptyDir(outputFolder).then(() => {
                return new Promise((resolve,reject) => {
                    // extract images from options.extend
                    glob(`${options.extend}/**/+(*.png|*.jpg)`,{"ignore":[`${options.extend}/**/+(*${HOVER_FILE_FLAG}.*|*${CURRENT_FILE_FLAG}.*|*${DISABLED_FILE_FLAG}.*)`]},(error,filesExtend) => {
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

                let cssOutputFile = `${outputFolder}/${options.cssSrc}/${options.baseName}.scss`;


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
                    let expectedHover = `${noExtFile}${HOVER_FILE_FLAG}.${ext}`,
                        expectedCurrent = `${noExtFile}${CURRENT_FILE_FLAG}.${ext}`,
                        expectedDisabled = `${noExtFile}${DISABLED_FILE_FLAG}.${ext}`;

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
                    Logger.log(`向${outputFolder}中输出文件完成,开始构建scss文件`)
                    return new Promise((resolve,reject) => {
                        let relativeImagePath = path.relative(/(.+)\//.exec(cssOutputFile)[1],/(.+)\//.exec(defaultOutputImageFile)[1]).replace(/\\/g,'/');
                        stylesheet += `/****** default hover current disable 4 state dest files ******/\n`;
                        stylesheet += `.${options.parentClassName},\n`+
                                       `.${DEFAULT_CLASS} .${options.parentClassName}{ \n`+
                                       `    display:inline-block;\n `+
                                       `   background-image:url("${relativeImagePath}/${defaultOutputImageName}")\n`+
                                       `}\n\n`
                        stylesheet += `.${options.parentClassName}.${HOVER_CLASS},\n`+
                                        `.${HOVER_CLASS} .${options.parentClassName}{ \n`+
                                        `   background-image:url("${relativeImagePath}/${hoverOutputImageName}")\n`+
                                        `}\n\n`
                        stylesheet += `.${options.parentClassName}.${CURRENT_CLASS},\n`+
                                        `.${CURRENT_CLASS} .${options.parentClassName}{ \n`+
                                        `   background-image:url("${relativeImagePath}/${currentOutputImageName}")\n`+
                                        `}\n\n`
                        stylesheet += `.${options.parentClassName}.${DISABLED_CLASS},\n`+
                                        `.${DISABLED_CLASS} .${options.parentClassName}{ \n`+
                                        `   background-image:url("${relativeImagePath}/${disabledOutputImageName}")\n`+
                                        `}\n\n`
                        stylesheet += `/****** background-position below ******/\n`;


                        Object.keys(cssSpriteStyle).forEach(key => {
                            stylesheet += `/* source file: ${/themes\/(.+)/.exec(key)[1]} */\n`;
                            let ClassObject = cssSpriteStyle[key];
                            let className = /([^\/]+\/?[^\/]+)\./.exec(key)[1].replace(/\//g,'-');
                            stylesheet += `.${options.parentClassName}.${className} {width: ${ClassObject.width}px; height: ${ClassObject.height}px; background-position:-${ClassObject.x}px -${ClassObject.y}px; }\n\n`
                        })
                        mkdirp(/(.*)[\/\\]/.exec(cssOutputFile)[1],(error) => {
                            if(error)
                                return reject(error)
                            fs.writeFile(cssOutputFile,stylesheet,(error) => {
                                if(error)
                                    return reject(error)
                                resolve()
                                Logger.log("scss 文件构建完成")
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