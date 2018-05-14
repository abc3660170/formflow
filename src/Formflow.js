var _ = require("underscore")
var data = require("../test/data")
var uuid = require("uuid");
var $ = require("jquery")
var Logger = require("js-logger")
Logger.useDefaults();
Logger.setLevel(Logger.DEBUG)
// Logger.info("OMG! Check  out!");

const Formflow = (($)=>{
    class Formflow {
        constructor(element,options) {
            this._element = element;
            this.options = _.extend({},options,Formflow.defaultOptions)
            Logger.debug("merged options:",this.options)
            this._init();
        }

        set_w(width) {

        }

        _init() {
            this.data = [];

        }

        _render() {
            const $element = this._element, data = this.data,options = this.options;
            let _data = this._calcRowData(data,options.layout),trs = "";
            for(let i = 0; i < _data.length; i++){
                let tr = "<tr>";
                let rowData = _data[i],tds = "";
                for(let j = 0; j < rowData.length; j++){
                    tds += `<td class="hc-formflow-label">${rowData[j].kText}</td><td class="hc-formflow-value">${rowData[j].vText}</td>`
                }
                tr = `<tr>`+
                        tds +
                    `</tr>`
                trs += tr
            }
            let tableDom = `<table class="hc-formflow">`+
                                `<tbody>`+
                                        trs+
                                `</tbody>`+
                            `</table>`
            $element.empty().append(tableDom)

        }

        /**
         * calculate pos for every single data
         * @param data
         * @returns {Array}
         * @private
         */
        _calcRowData(data,layout) {
            let maxColNum = layout[0]
            layout.forEach((colNum) => {
                if(colNum > maxColNum)
                    maxColNum = colNum;
            })
            let i = 0,row = [],rowedData = [];
            data.forEach((col) => {
                if(i === 0 || i == maxColNum){
                    rowedData.push(row = [])
                }
                i++
                row.push(col)
            })
            Logger.debug("rowedData:",rowedData)
            return rowedData
        }

        setData(data){
            Logger.debug("invoke setData function")
            data.forEach(function(val){
                _.extend(val,Formflow.defaultMetaOptions())
            })
            this.data = data
            Logger.debug("merged data:",data)
            this._render();
        }

        static defaultMetaOptions(){
            return {
                weight:Formflow.NORMAL,
                id:uuid(),
                index:Formflow.INDEXSTART
            }
        }

        static _jQueryInterface(config){
            const _config = typeof config === 'object' ? config : null
            const params = Array.prototype.slice.call(arguments,1)
            const methodName = arguments[0]
            return this.each(function(){
                const $element = $(this);
                let data = $element.data("hc-formflow")
                if(!data){
                    data = new Formflow($element,_config)
                    $element.data("hc-formflow",data);
                }
                if(typeof methodName === 'string'){
                    if(data[config] === 'undefined'){
                        throw new TypeError(`No method "${config}"`)
                    }
                    data[methodName].apply(data,params)
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

    $.fn.formflow = Formflow._jQueryInterface;
    $.fn.formflow.Constructor = Formflow

})($)
$("#form").formflow();
$("#form").formflow("setData",data)
module.exports = Formflow;






