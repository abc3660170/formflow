var log = require("log4js")
var _ = require("underscore")
var data = require("../test/data")

class Formflow {
    constructor(){

    }

    set_w(width){

    }

    static defaultMetaOptions(){
        return {
            weight:Formflow.NORMAL,
            id:Formflow.uuid(),
            index:Formflow.INDEXSTART
        }
    }

    setData(){
        data.forEach(function(val){
            _.extend(val,)
        })
    }
}

// weight var
Formflow.LIGHTER = -2
Formflow.LIGHT = -1
Formflow.NORMAL = 0
Formflow.HEAVEY = 1
Formflow.HEAVEYER = 2

// the index of index and groupstart
Formflow.INDEXSTART = 0

Formflow.defaultOptions = {
    layout:[1,2,4]
}

