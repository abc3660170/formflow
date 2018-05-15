var _ = require("underscore")
var data = require("../test/data")
var uuid = require("uuid");
var $ = require("jquery")
var Logger = require("js-logger")
Logger.useDefaults();
Logger.setLevel(Logger.DEBUG)
// Logger.info("OMG! Check  out!");

const Formflow = (($)=>{
    const NAME = 'formflow'
    const DATA_KEY = 'hc.'
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
                    if(typeof rowData[j].vFill !== 'undefined'){
                        tds += `<td class="hc-formflow-value"  colspan="${rowData[j].colspan}">${rowData[j].vFill}</td>`
                    }else{
                        tds += `<td class="hc-formflow-label" colspan="${rowData[j].kColspan}">${rowData[j].kText}</td><td class="hc-formflow-value"  colspan="${rowData[j].vColspan}">${rowData[j].vText}</td>`
                    }
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
            /*** first base max number of layout fit rows  ***/
            let maxColNum = layout;
            let i = 0,row = [],rowedData = [];
            data.forEach((col) => {
                // current col need space colspan
                const colspan = col.weight ? col.weight : 1;
                // the rest of current row's space
                const remainedCol = maxColNum - i;
                // if fill all columns or comes a long col which weight > rest of space
                if(i % maxColNum === 0 || colspan > remainedCol){
                    rowedData.push(row = [])
                    i = colspan
                }else{
                    i = i + colspan
                }
                col.vColspan = colspan * 2  - 1;
                row.push(col)
            })

            /*** fill evey rows rest space with blanks ***/
            return this._fillBlanks(rowedData,this.options.layout)
        }

        _fillBlanks(rowsData,layout) {
            let _rowsData = $.extend([],rowsData),self = this;
            _rowsData.forEach(function(row){
                var emptyColNum = layout * 2;
                row.forEach((col) => {
                    emptyColNum = emptyColNum - col.kColspan - col.vColspan
                })
                if(emptyColNum > 0)
                    row.push(self._formatColData({"vFill":"","colspan":emptyColNum}))
            })
            Logger.debug("filledBlanks data is:",_rowsData)
            return _rowsData;
        }

        _formatColData(data) {
           data = $.extend({},Formflow.defaultMetaOptions(),data)
           return data
        }

        setData(data){
            let self = this;
            Logger.debug("invoke setData function")

            // sort data
            //self.sortDatabyIndex(data)
            Logger.debug("sortbyIndex data:",data)

            // format data
            data.forEach(function(val,index){
                data[index] = self._formatColData(val)
            })

            this.data = data
            Logger.debug("merged data:",data)
            this._render();
        }

        sortDatabyIndex(data) {
            if(!$.isArray(data) || data.length === 0)
                return [];
            if(typeof data[0].index !== 'undefined'){
                // if data has index property,sort data by index
                data.sort(function(a,b){
                    if(a.index > b.index){
                        return 1
                    }
                    if(a.index < b.index){
                        return -1
                    }
                    return 0
                })
            }
        }

        static defaultMetaOptions(){
            return {
                weight:Formflow.NORMAL,
                id:uuid(),
                index:Formflow.INDEXSTART,
                originOrder:Formflow.INDEXSTART++,
                kColspan:1,
                vColspan:1
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



// the index of index and groupstart
    Formflow.INDEXSTART = 0

    Formflow.defaultOptions = {
        layout:5 // layout cols contains 1,2,4 three
    }

    let plugin = $.fn[NAME] = Formflow._jQueryInterface;
                 $.fn[NAME].Constructor = Formflow

    // weight var
    // todo 静态变量暴露方式不优雅
    plugin.LIGHTER = Formflow.LIGHTER = -2
    plugin.LIGHT = Formflow.LIGHT = -1
    plugin.NORMAL = Formflow.NORMAL = 0
    plugin.HEAVEY = Formflow.HEAVEY = 1
    plugin.HEAVEYER = Formflow.HEAVEYER = 2

})($)
$("#form").formflow();
$("#form").formflow("setData",data)
module.exports = Formflow;






