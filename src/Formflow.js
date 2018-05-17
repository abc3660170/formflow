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


        _init() {
            this.data = [];
        }

        /**
         * render dom to browser
         * @private
         */
        _render() {
            this._renderTable();
        }

        /**
         * render data to table structure
         * @private
         */
        _renderTable(){
            // avg space to every standrd td (no colspan)
            const tdWidth = Number(1 / (this.options.layout * 2))
            const $element = this._element, data = this.data,options = this.options;
            let _data = this._calcRowData(data,options.layout)
            let trs = "";
            for(let i = 0; i < _data.length; i++){
                let tr = "<tr>";
                let rowData = _data[i],tds = "";
                for(let j = 0; j < rowData.length; j++){
                    tds += this._renderTd(rowData[j])
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
         * adjust every td the same width
         * @private
         */
        _calcWidth(rowedData,layout) {
            var maxTdNum = layout * 2;
            rowedData.forEach( row => {
                row.forEach(col => {
                    col.kWidth = Number(col.kColspan) / maxTdNum * 100 + "%"
                    col.vWidth = Number(col.vColspan) / maxTdNum * 100 + "%"
                })
            })
            return rowedData
        }


        /**
         * create single kv data
         * @param colData
         * @returns {string}
         * @private
         */
        _renderTd(colData) {
            return  `<td tag="label" class="hc-formflow-label"  
                        colId="${colData.id}" 
                        width="${colData.kWidth}"
                        colspan="${colData.kColspan}">
                            ${colData.kText}
                    </td>
                    <td tag="value" class="hc-formflow-value"
                        colId="${colData.id}" 
                         width="${colData.vWidth}"
                        colspan="${colData.vColspan}">
                            ${!colData.querying ? colData.vText : this._addLoadingTip(colData.id)}
                    </td>`
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
            data.forEach( col => {
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
                col.vColspan = colspan * 2  - col.kColspan;
                row.push(col)
            })
            Logger.debug("calcRowData",rowedData)
            this._expandTd(rowedData,this.options.layout)
            return this._calcWidth(rowedData,this.options.layout)
        }

        /**
         * fill rest of row space with blanks
         * @param rowsData
         * @param layout
         * @returns {*}
         * @private
         */
        _fillBlanks(rowsData,layout) {
            let _rowsData = $.extend([],rowsData),self = this;
            _rowsData.forEach((row) => {
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

        /**
         * let every row's last col expand to end
         * @param rowsData
         * @param layout
         * @returns {*}
         * @private
         */
        _expandTd(rowsData,layout) {
            rowsData.forEach( row => {
                var emptyColNum = layout * 2;
                row.forEach( col => {
                    emptyColNum = emptyColNum - col.kColspan - col.vColspan
                })
                if(emptyColNum > 0)
                    row[row.length - 1].vColspan = row[row.length - 1].vColspan + emptyColNum
            })
            return rowsData
        }

        _formatColData(data) {
           data = $.extend({},Formflow.defaultMetaOptions(),data)
           return data
        }

        setData(data){
            let self = this;
            Logger.debug("invoke setData function")

            // sort data
            self.sortDatabyIndex(data)
            Logger.debug("sortbyIndex data:",data)

            // format data
            data.forEach((val,index) => {
                data[index] = self._formatColData(val)
            })

            this.data = data
            Logger.debug("merged data:",data)
            this._render();
        }

        /**
         * this.data is not original data has been merged
         * @returns {Array|*}
         */
        getData() {
            return $.extend(true,[],this.data);
        }

        /**
         * get single col data by id
         * @param id
         * @returns {*|null}
         */
        getColbyId(id,isClone = true) {
            let col;
            this.data.forEach( item => {
                if(item.id === id)  {
                    col = item
                }
                return;
            })
            return typeof col !== 'undefined' ? isClone ? $.extend(true,{},col) : col : null;
        }

        /**
         * update col data by id
         * @param id
         * @param col
         */
        updateCol(col) {
            // must have id
            let $element = this._element;
            const sourceId = col.id;
            if(typeof sourceId === 'undefined'){
                Logger.error("update col must have id segment");
                return false
            }
            // some var are readonly
            delete col.kWidth;
            delete col.vWidth;
            delete col.index;
            delete col.kColspan;
            delete col.vColspan;

            let targetCol = this.getColbyId(sourceId);
            if(targetCol){
                $.extend(targetCol,col)
                // since now just update two show segments
                this._getDom(targetCol.id,"value").html(targetCol.vText)
                this._getDom(targetCol.id,"label").html(targetCol.kText)
                return true;
            }else{
                return false;
            }
        }

        /**
         * get dom not care really dom
         * @param colId : colId
         * @param tag : identify k or v or others
         * @private
         */
        _getDom(colId,tag) {
            let $element = this._element;
            return $element.find(`td[colId="${colId}"][tag="${tag}"]`)
        }


        _addLoadingTip() {
            return  "<div class=\"spinner\">\n" +
                    "    <div class=\"bounce1\"></div>\n" +
                    "    <div class=\"bounce2\"></div>\n" +
                    "    <div class=\"bounce3\"></div>\n" +
                    "</div>";
        }


        /**
         * sort by col's index asc
         * @param data
         * @returns {Array}
         */
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

        // col required basic metadata
        static defaultMetaOptions(){
            return {
                weight:1, // take default space
                id:uuid(),
                querying:false, // getding  ajax data,loading state
                index:Formflow.INDEXSTART, // which number effect order
                originOrder:Formflow.INDEXSTART++,  // self add key
                kColspan:1, //default key space
                vColspan:1  //default value space
            }
        }

        static _jQueryInterface(config){
            const _config = typeof config === 'object' ? config : null;
            const params = Array.prototype.slice.call(arguments,1);
            const methodName = arguments[0];
            let returnValue;
            this.each(function(){
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
                    returnValue= data[methodName].apply(data,params)
                }
            })
            return typeof returnValue === 'undefined' ? this : returnValue
        }
    }

    // the index of index and groupstart
    Formflow.INDEXSTART = 0

    Formflow.defaultOptions = {
        layout:4, // layout cols is 4
        animate:true
    }

    $.fn[NAME] = Formflow._jQueryInterface;
    $.fn[NAME].Constructor = Formflow

})($)
module.exports = Formflow;






