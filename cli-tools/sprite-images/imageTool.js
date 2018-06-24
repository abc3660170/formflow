let Spritesmith = require('spritesmith');
let glob = require('glob');
let fs = require('fs');
let path = require('path')
let fsExtra = require('fs-extra');
let Logger = require('js-logger')
let mkdirp = require('mkdirp')
let tools = require("../commonTools");
let handleBars = require('handleBars');

Logger.useDefaults();
function genImages(inputFolder,outputFolder,options) {
    typeof options.isSprite === 'undefined' ? options.isSprite = true : options.isSprite = false;
    // pattern of 4 state images for match
    const
        HOVER_FILE_FLAG    = '-hover',
        CURRENT_FILE_FLAG  = '-current',
        DISABLED_FILE_FLAG = '-disabled';

    // state class of css
    const
        DEFAULT_CLASS  = 'hc-default',
        HOVER_CLASS    = 'hc-hover',
        CURRENT_CLASS  = 'hc-current',
        DISABLED_CLASS = 'hc-disabled';

    // find default state image exclude hover 、current、disabled
    let defaultFiles = [],
        hoverFiles   = [],
        currentFiles = [],
        disabledFiles= [];
    // output images' name
    let defaultOutputImageName = `${options.baseName}.png`,
        hoverOutputImageName = `${options.baseName}_hover.png`,
        currentOutputImageName = `${options.baseName}_current.png`,
        disabledOutputImageName = `${options.baseName}_disabled.png`;
    // output images file with path
    let defaultOutputImageFile = `${outputFolder}/${options.imgSrc}/${defaultOutputImageName}`,
        hoverOutputImageFile = `${outputFolder}/${options.imgSrc}/${hoverOutputImageName}`,
        currentOutputImageFile = `${outputFolder}/${options.imgSrc}/${currentOutputImageName}`,
        disabledOutputImageFile = `${outputFolder}/${options.imgSrc}/${disabledOutputImageName}`;
    // output css file with path
    let cssOutputFile = `${outputFolder}/${options.cssSrc}/${options.baseName}.css`;
    // output api html with path
    let apiOutputFile = `${outputFolder}/${options.apiSrc}/${options.baseName}.html`;

    return new Promise((resolve,reject) => {
        /**
         *  extract images from options.extend
         **/
        inputFolder = tools.formatUrl(inputFolder);
        outputFolder = tools.formatUrl(outputFolder);
        options.extend = tools.formatUrl(options.extend);
        glob(`${inputFolder}/**/+(*.png|*.jpg)`,{"ignore":[`${inputFolder}/**/+(*${HOVER_FILE_FLAG}.*|*${CURRENT_FILE_FLAG}.*|*${DISABLED_FILE_FLAG}.*)`]},(error,files) => {
            if (error)
                throw error;
            // if(files.length === 0)
            //     return reject(`${inputFolder}目录下没有图片！`);
            // clean dest folders
            tools.deleteFiles([defaultOutputImageFile,hoverOutputImageFile,currentOutputImageFile,disabledOutputImageFile,cssOutputFile],error => {
                Logger.log("清理输出目录... ",outputFolder)
                if(error){
                    Logger.error("目录清理失败",outputFolder)
                    return reject(error)
                }
                return new Promise((resolve,reject) => {
                    glob(`${options.extend}/**/+(*.png|*.jpg)`,{"ignore":[`${options.extend}/**/+(*${HOVER_FILE_FLAG}.*|*${CURRENT_FILE_FLAG}.*|*${DISABLED_FILE_FLAG}.*)`]},(error,filesExtend) => {
                        if (error)
                            throw error;
                        if(filesExtend.length === 0)
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
                }).then((expectedFiles) => {
                    resolve(expectedFiles);
                }).catch((error) => {
                    setTimeout(function(){
                        throw error;
                    })
                })
            })
        })
    }).then((expectedFiles) => {
        Logger.log("目录已经清理完毕",outputFolder)
        return new Promise((resolve,reject) => {
            defaultFiles = expectedFiles;
            // check if some images all states numbers < 4 fill up all other state
            Logger.log("开始对齐4状态图标...",outputFolder)
            let fileCheckerrorMsg = [];
            defaultFiles.forEach((imageDefault) => {
                let imageDefaultName = imageDefault.substring(imageDefault.lastIndexOf('/') + 1);
                // filename cant include : _ , uppercase char , more then one dot
                if(/([_A-Z]|\..*\.)/.test(imageDefaultName))
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

            //generate all four state sprite images
            Logger.log(`开始向${outputFolder}中输出文件...`)

            let processFiles = [];
            if(options.isSprite){
                processFiles = [
                    genImage(defaultFiles,defaultOutputImageFile),
                    genImage(hoverFiles,hoverOutputImageFile),
                    genImage(currentFiles,currentOutputImageFile),
                    genImage(disabledFiles,disabledOutputImageFile)
                ];
            }else{
                let ouputDir = /(.+)\//.exec(defaultOutputImageFile)[1];
                processFiles = [genImage(defaultFiles,ouputDir)];
            }
            Promise.all(processFiles).then((cssSpriteStyles) => {
                Logger.log(`向${outputFolder}中输出文件完成,开始构建scss文件`)
                return new Promise((resolve,reject) => {
                    let cssSpriteStyle = cssSpriteStyles[0];
                    genScss(cssSpriteStyle).then(() => {
                        Logger.log("genScss全部完成",outputFolder)
                        resolve(cssSpriteStyle)
                    }).catch((error) => {
                        return reject(error)
                    })
                })
            }).then((cssSpriteStyle) => {
                genApi(cssSpriteStyle).then(() => {
                    resolve();
                }).catch(error => {
                    return reject(error);
                })
            }).catch(function(error){
                // handle gen images exception
                return reject(error);
            })
        })
    }).catch((error) => {
        setTimeout(function(){
            throw error;
        })
    })
    function genImage(files,output) {
        if(options.isSprite){
            return genSpriteImage(files,output)
        }else{
            return genlonelyImage(files,output)
        }
    }

    function genSpriteImage(files,output){
        return new Promise((resolve,reject) => {
            Spritesmith.run({src:files},(error,result) => {
                if(error) {
                    return reject(error);
                }
                if(Object.keys(result.coordinates).length !== 0){
                    mkdirp(/(.*)[\/\\]/.exec(output)[1],(error) => {
                        if(error)
                            return reject(error)
                        fs.writeFile(output,result.image,(error) => {
                            if(error)
                                return reject(error)
                            resolve(result.coordinates)
                        })
                    })
                }
            })
        })
    }

    function genlonelyImage(files,output){
        return new Promise((resolve,reject) => {
            let stylesArray = [];
            let count = 0;
            files.forEach(file => {
                Spritesmith.run({src:[file]},(error,result) => {
                    if(error)
                        return reject(error);
                    let fileName = /\/([^\/]*)$/.exec(file)[1];
                    mkdirp(output,(error) => {
                        if(error)
                            return reject(error);
                        fs.writeFile(`${output}/${fileName}`,result.image,(error) => {
                            if(error)
                                return reject(error)
                            stylesArray.push(result.coordinates)
                            count++;
                            if(count === files.length){
                                resolve(stylesArray);
                            }
                        })
                    })

                })
            })
        })
    }
    function genScss(stylesheets){
        if(options.isSprite){
            return genSateScss(stylesheets)
        }else{
            return genLonelyScss(stylesheets)
        }
    }


    function genSateScss(stylesheetObj){
        let stylesheet = "";
        return new Promise((resolve,reject) => {
            let relativeImagePath = path.relative(/(.+)\//.exec(cssOutputFile)[1],/(.+)\//.exec(defaultOutputImageFile)[1]).replace(/\\/g,'/');
            stylesheet += `/****** default hover current disable 4 state dest files ******/\n`;
            stylesheet += `.${options.parentClassName},\n`+
                `.${DEFAULT_CLASS} .${options.parentClassName}{ \n`+
                `    display:inline-block;\n `+
                `   background-image:url("${relativeImagePath}/${defaultOutputImageName}");\n`+
                `}\n\n`
            stylesheet += `.${options.parentClassName}.${HOVER_CLASS}:hover,\n`+
                `.${HOVER_CLASS} .${options.parentClassName}{ \n`+
                `   background-image:url("${relativeImagePath}/${hoverOutputImageName}");\n`+
                `}\n\n`
            stylesheet += `.${options.parentClassName}.${CURRENT_CLASS},\n`+
                `.${CURRENT_CLASS} .${options.parentClassName}{ \n`+
                `   background-image:url("${relativeImagePath}/${currentOutputImageName}");\n`+
                `}\n\n`
            stylesheet += `.${options.parentClassName}.${DISABLED_CLASS},\n`+
                `.${DISABLED_CLASS} .${options.parentClassName}{ \n`+
                `   background-image:url("${relativeImagePath}/${disabledOutputImageName}");\n`+
                `}\n\n`
            stylesheet += `/****** background-position below ******/\n`;


            Object.keys(stylesheetObj).forEach(key => {
                stylesheet += `/* source file: ${/themes\/(.+)/.exec(key)[1]} */\n`;
                let ClassObject = stylesheetObj[key];
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
    }
    function genLonelyScss(stylesheetArr){
        let stylesheet = "";
        return new Promise((resolve,reject) => {
            let relativeImagePath = path.relative(/(.+)\//.exec(cssOutputFile)[1],/(.+)\//.exec(defaultOutputImageFile)[1]).replace(/\\/g,'/');
            stylesheetArr.forEach(styleObject => {
                Object.keys(styleObject).forEach(key => {
                    let ClassObject = styleObject[key];
                    let className = /([^\/]+\/?[^\/]+)\./.exec(key)[1].replace(/\//g,'-');
                    let fileName = /\/([^\/]+)$/.exec(key)[1]
                    stylesheet += `.${options.parentClassName}.${className} {\n`+
                        `    display:inline-block;\n `+
                        `   width: ${ClassObject.width}px;`+
                        `   height: ${ClassObject.height}px;`+
                        `   background-image:url("${relativeImagePath}/${fileName}");\n`+
                        `}\n\n`
                })
            });
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
    }

    function genApi(spriteStylesheet){
        return new Promise((resolve,reject) => {
            if(typeof options.apiSrc === 'undefined'){
                Logger.log("没有配置apiSrc,无需生成API",outputFolder);
                return resolve();
            }
            let classList = [];
            Object.keys(spriteStylesheet).forEach(key => {
                classList.push(/([^\/]+\/?[^\/]+)\./.exec(key)[1].replace(/\//g,'-'));
            })
            // prepare date for hbs template
            let cssUrl = path.relative(/(.+)\//.exec(apiOutputFile)[1],/(.+)\//.exec(cssOutputFile)[1]).replace(/\\/g,'/')+`/${options.baseName}.css`;
            let apiData = {
                classList:classList,
                parentClassName:options.parentClassName,
                cssUrl:cssUrl,
                stateClass:{
                    "default":DEFAULT_CLASS,
                    "hover":HOVER_CLASS,
                    "current":CURRENT_CLASS,
                    "disabled":DISABLED_CLASS
                }
            }
            fs.readFile(path.resolve(__dirname,"./hbs/icons.handleBars"),(err,data) => {
                if(err){
                    Logger.error("API文件读取错误",err)
                    return reject(err);
                }
                mkdirp(/(.*)[\/\\]/.exec(apiOutputFile)[1],(error) => {
                    if(error)
                        return reject(error)
                    let template = handleBars.compile(data.toString())
                    fs.writeFile(apiOutputFile,template(apiData),(error) => {
                        if(error)
                            return reject(error)
                        resolve()
                        Logger.log("api文件构建完成",outputFolder)
                    })
                })
            });
        })
    }
}

module.exports.genImages = genImages;