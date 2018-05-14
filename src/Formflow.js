var _ = require("underscore")
var data = require("../test/data")
var uuid = require("uuid");
var $ = require("jquery")
var Logger = require("js-logger")
Logger.useDefaults();
Logger.info("OMG! Check  out!");

const Formflow = (($)=>{
    class Formflow {
        constructor(){
            this._init();
        }

        set_w(width){

        }

        _init(){

        }

        setData(){
            data.forEach(function(val){
                _.extend(val,Formflow.defaultMetaOptions())
            })
        }

        static defaultMetaOptions(){
            return {
                weight:Formflow.NORMAL,
                id:uuid(),
                index:Formflow.INDEXSTART
            }
        }

        static _jQueryInterface(config){
            return this.each(function(){
                const $element = $(this);
                let data = $element.data("hc-formflow")
                if(!data){
                    data = new Formflow()
                    $element.data("hc-formflow",data);
                }
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
        layout:[1,2,4] // layout cols contains 1,2,4 three
    }

    $.fn.formflow = Formflow._jQueryInterface();
    $.fn.formflow.Constructor = Formflow

})($)
let test = new Formflow()
test.setData(data)
module.exports = Formflow;






