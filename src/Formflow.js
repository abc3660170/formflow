const uuid = require("uuid");
const $ = require("jquery");
const Logger = require("js-logger");
Logger.useDefaults();
Logger.setLevel(Logger.DEBUG);
// Logger.info("OMG! Check  out!");

const Formflow = (($)=>{
    const NAME = 'formflow'
    const DATA_KEY = 'hc.'
    class Formflow {

        constructor(element,options) {
            this._element = element;
            this.options = $.extend({},options,Formflow.defaultOptions)
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
        render(layout) {
            const _layout = typeof layout === 'undefined' ? this.options.layout : layout
            this.currentLayout = _layout
            // rowed data
            this._calcRowData(this.data,_layout)
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
            let _data = this.rowedData;
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
            $element.empty().append($(tableDom))
            // enable show fadein animate
            if(options.animate){
                let $trs = $element.find("tr");
                const timeDivide = Formflow.ANIMATETIME / $trs.size();
                $trs
                    .hide()
                    .each((index,tr) => {
                        $(tr).fadeIn(timeDivide * index)
                    })
            }
        }


        _setContainerWidth(width) {
            let options = this.options,rowedData = this.rowedData;
            const allColSpace = this.currentLayout * 2;
            rowedData.forEach( row => {
                if(typeof options.kWidth === 'number') {
                    // because of kWidth is scale number
                    let divisor = (allColSpace - row.length) + row.length * options.kWidth
                    row.forEach(col => {
                        col.kWidth = (options.kWidth * (1 / divisor)) * 100 + "%"
                        col.vWidth = (1 / divisor * col.vColspan) * 100 + "%"
                    })
                }else if(typeof options.kWidth === 'string') {
                    //todo fixed pixel kWidth do resize
                    const containerWidth = width;
                    // vLeftWidth is container's width - all certain kWidth
                    let vLeftWidth = containerWidth - row.length * parseInt(options.kWidth)
                    row.forEach(col => {
                        col.kWidth = options.kWidth
                        col.vWidth = (vLeftWidth / row.length)+"px";
                    })
                }
            })
        }

        _resizeDom (){
            let $element = this._element,options = this.options,data = this.data;
            if (typeof options.kWidth === 'string'){
                Logger.debug("resizing dom ...")
                this._setContainerWidth($element.width())
                let $tds = $element.find("td[colId]");
                $tds.each((index,td) => {
                    if(index % 2 === 0){
                        $(td).width(data[Math.floor(index/2)].kWidth);
                    }else{
                        $(td).width(data[Math.floor(index/2)].vWidth);
                    }
                })
            }
        }


        /**
         * create single kv data
         * @param colData
         * @returns {string}
         * @private
         */
        _renderTd(colData) {
            return  `<td  class="hc-formflow-label"  
                        colId="${colData.id}" 
                        colspan="${colData.kColspan}"
                        style="width: ${colData.kWidth};">
                            <span tag="label">${colData.kText}</span>
                     </td>
                     <td class="hc-formflow-value"
                        colId="${colData.id}" 
                        colspan="${colData.vColspan}"
                        style="width: ${colData.vWidth};">
                            <span tag="value">${!colData.querying ? colData.vText : this._addLoadingTip(colData.id)}</span>
                     </td>`
        }

        /**
         * calculate pos for every single data
         * @param data
         * @returns {Array}
         * @private
         */
        _calcRowData(data,layout) {

            let $element = this._element;

            /*** first base max number of layout fit rows  ***/
            let maxColNum = layout;

            // layout < options.layout will be OK,it's spec.
            if(layout > this.options.layout)
                throw Error("lcurrent layout must lower options.layout");

            let i = 0,row = [],rowedData = [];
            data.forEach( col => {
                // current col need space colspan
                const colspan = col.weight ? col.weight > layout ? layout : col.weight : 1;
                // the rest of current row's space
                const remainedCol = maxColNum - i;
                // if fill all columns or comes a long col which weight > rest of space
                if(i % maxColNum === 0 || colspan > remainedCol){
                    rowedData.push(row = [])
                    i = colspan
                }else{
                    i = i + colspan
                }

                // backup origin  kColspan and vColspan with _ prefix.
                col._kColspan = col.kColspan;
                col._vColspan = col.vColspan = colspan * 2  - col.kColspan;
                row.push(col)
            })

            this.rowedData = rowedData;
            // expand last col to row's end
            this._expandSpace()

            //use width property with % unit
            this._setContainerWidth($element.width());

            Logger.debug("calcRowData",rowedData)
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
        _expandSpace() {
            let options = this.options,rowsData = this.rowedData;
            rowsData.forEach( row => {
                var emptyColNum = options.layout * 2;
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

            let self = this,options = this.options;
            Logger.debug("invoke setData function")
            data = $.extend(true,[],data);

            // sort data
            self.sortDatabyIndex(data)
            Logger.debug("sortbyIndex data:",data)

            // format data
            data.forEach((val,index) => {
                data[index] = self._formatColData(val)
            })

            // bind data to plugin
            this.data = data

            Logger.debug("merged data:",data)
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
            // close loading state
            col.querying = false;

            let targetCol = this.getColbyId(sourceId);
            if(targetCol){
                $.extend(targetCol,col)
                // since now just update two show segments
                this._setDomValue(this._getDom(targetCol.id,"value"),targetCol.vText)
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
            return $element.find(`td[colId="${colId}"] [tag="${tag}"]`)
        }


        _setDomValue($dom,val) {
            let options = this.options;
            if(options.animate){
                $dom.html(val).hide();
                $dom.fadeIn(1000)
            }else{
                $dom.html(val)
            }
        }


        /**
         * wating data comes
         * @returns {string}
         * @private
         */
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

    //
    Formflow.ANIMATETIME = 1500

    Formflow.defaultOptions = {
        layout:4, // layout cols is 4
        kWidth:"200px",// pixel or scale
        animate:true // enable animate ?
    }

    $.fn[NAME] = Formflow._jQueryInterface;
    $.fn[NAME].Constructor = Formflow

})($)
module.exports = Formflow;






