let path =  require('path');
let Logger = require('js-logger')
let genImages = require('./genImages')

Logger.useDefaults();

const BASE_IMAGES_DIR = path.resolve(__dirname,'../../packages/images');
// 组件内部使用的图片素材
genImages.gen4state(`${BASE_IMAGES_DIR}/dark/`,`${BASE_IMAGES_DIR}/dist/default/chaos`,{baseName:'icon2'},(error) => {
    if(error)
        throw error
})
//



