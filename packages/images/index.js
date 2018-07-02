let path =  require('path');
let Logger = require('js-logger')
let glob = require('glob')
let imageTool = require('../../cli-tools/sprite-images/imageTool')
let fs = require('fs');

Logger.useDefaults();

const BASE_IMAGES_DIR = path.resolve(__dirname,'../../packages/images');

new chaos().then(() => {
    return new icons()
}).then(() =>{
    return new gif();
}).then(() => {
    return new entrance()
}).catch(error => {
    setTimeout(() => {
        throw error;
    })
})

/**
 * plugin private images include all states
 * @returns {Promise<any>}
 */
function chaos() {
    return new Promise((resolve,reject) => {
        glob(`${BASE_IMAGES_DIR}/themes/*`,function(error,themesDirs){
            let chaosPromises = [];
            themesDirs.forEach(themeDir => {
                let theme = themeDir.substring(themeDir.lastIndexOf('/') + 1);
                chaosPromises.push(imageTool.genImages(`${themeDir}/chaos`,`${BASE_IMAGES_DIR}/dist/${theme}`,{
                    imgSrc:"img/chaos",
                    cssSrc:"css",
                    parentClassName:"hc-chaos",
                    baseName:'hc-chaos',
                    extend:`${BASE_IMAGES_DIR}/themes/default/chaos`
                }))
            })
            Promise.all(chaosPromises)
            .then(() => {
                Logger.log("============= 内部组件使用的 单/多 状态图标 流程结束！==============")
                resolve()
            })
            .catch(error => {
                reject(error)
            })
        })
    })
}

/**
 * standard icons for common use
 * @returns {Promise<any>}
 */
function icons(){
    return new Promise((resolve,reject) => {
        glob(`${BASE_IMAGES_DIR}/themes/*`,function(error,themesDirs){
            let chaosPromises = [];
            themesDirs.forEach(themeDir => {
                let theme = themeDir.substring(themeDir.lastIndexOf('/') + 1);
                chaosPromises.push(imageTool.genImages(`${themeDir}/hc-icons-32`,`${BASE_IMAGES_DIR}/dist/${theme}`,{
                    imgSrc:"img/hc-icons-32",
                    cssSrc:"css",
                    apiSrc:"api",
                    parentClassName:"hc-icons-32",
                    baseName:'hc-icons-32',
                    extend:`${BASE_IMAGES_DIR}/themes/default/hc-icons-32`
                }))
            })
            Promise.all(chaosPromises)
            .then(() => {
                Logger.log("============= 公共图标库 流程结束！=============")
                resolve()
            })
            .catch(error => {
                reject(error)
            })
        })
    })
}

/**
 * one image one file 
 * @returns {Promise<any>}
 */
function gif(){
    return new Promise((resolve,reject) => {
        glob(`${BASE_IMAGES_DIR}/themes/*`,function(error,themesDirs){
            let chaosPromises = [];
            themesDirs.forEach(themeDir => {
                let theme = themeDir.substring(themeDir.lastIndexOf('/') + 1);
                chaosPromises.push(imageTool.genImages(`${themeDir}/loneRanger`,`${BASE_IMAGES_DIR}/dist/${theme}`,{
                    imgSrc:"img/lonely",
                    cssSrc:"css",
                    parentClassName:"hc-lonely",
                    baseName:'hc-lonely',
                    isSprite:false,
                    extend:`${BASE_IMAGES_DIR}/themes/default/loneRanger`
                }))
            })
            Promise.all(chaosPromises)
            .then(() => {
                Logger.log("============= gif 流程结束！=============")
                resolve()
            })
            .catch(error => {
                reject(error)
            })
        })
    })
}

/**
 * init index.scss
 */
function entrance() {
    return new Promise ((resolve,reject) => {
        let defaultStyle = `${BASE_IMAGES_DIR}/dist/default/css/**/*.scss`;
        glob(defaultStyle,(error,files) => {
            if(error)
                reject(error)
            let cssString = "";
            files.forEach(file => {
                cssString += `@import "${path.relative(BASE_IMAGES_DIR,file).replace(/\\/g,"/")}";\n`
            })
            fs.writeFile(`${BASE_IMAGES_DIR}/index.scss`,cssString,{encoding:"utf-8"},err => {
                if(error)
                    reject(error)
                resolve()
                Logger.info("=============  生成入口流程结束！=============")
            })
        })
    })
}





