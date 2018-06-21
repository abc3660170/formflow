let path =  require('path');
let Logger = require('js-logger')
let glob = require('glob')
let imageTool = require('./imageTool')

Logger.useDefaults();

const BASE_IMAGES_DIR = path.resolve(__dirname,'../../packages/images');

new Promise((resolve,reject) => {
    /****** 内部组件使用的 单/多 状态图标 ******/
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
                console.log("false")
                console.log(error)
                process.exit(0)
            })
    })
}).then(() => {
    /****** 内部组件使用的 单/多 状态图标 ******/
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
            })
            .catch(error => {
                console.log("false")
                console.log(error)
                process.exit(0)
            })
    })
})




