let path =  require('path');
let Logger = require('js-logger')
let glob = require('glob')
let imageTool = require('./imageTool')

Logger.useDefaults();

const BASE_IMAGES_DIR = path.resolve(__dirname,'../../packages/images');

/****** 内部组件使用的 单/多 状态图标 ******/
glob(`${BASE_IMAGES_DIR}/themes/*`,function(error,themesDirs){
    let chaosPromises = [];
    themesDirs.forEach(themeDir => {
        let theme = themeDir.substring(themeDir.lastIndexOf('/') + 1);
        chaosPromises.push(imageTool.genImages(`${themeDir}/chaos`,`${BASE_IMAGES_DIR}/dist/${theme}`,{
            imgSrc:"img/chaos",
            cssSrc:"./",
            parentClassName:"honeycomb-icon",
            baseName:'icon2',
            extend:`${BASE_IMAGES_DIR}/themes/default/chaos`
        }))
    })
    Promise.all(chaosPromises)
        .then(() => {
            console.log("true")
        })
        .catch(error => {
            console.log("false")
            console.log(error)
            process.exit(0)
        })
})




