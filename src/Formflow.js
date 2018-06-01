import { uuid }  from './utils/workbee'
import $ from 'jquery';
import Logger from 'js-logger';
import templateTable from '../templates/basic-table.handlebars'
Logger.useDefaults();
Logger.setLevel(Logger.DEBUG);

// export to window
const Formflow = (($)=>{
    const NAME = 'formflow';
    const DATA_KEY = 'hc.formflow';
    const EVENT_KEY = `.{DATA_KEY}`;

    const EVENT = {
        'RESIZE':`resize${EVENT_KEY}`
    };

    class Formflow {
        constructor(element,options) {
            this._element = element;
            this.options = $.extend({},Formflow.defaultOptions,options);
            Logger.debug("merged options:",this.options);
            this._init();
        }

        _init() {
            this.data = [];
            if(this.options.autoResize)
                this._enableAutoReszie();
        }

        /**
         * render dom to browser
         * @param layout - total cols number
         * @private
         */
        render(layout) {
           this._renderTable(layout);
        }

        /**
         * render table style template doms
         * @param layout
         * @private
         */
        _renderTable(layout) {
            let $element = this._element,options = this.options;
            const _layout = typeof layout === 'undefined' ? this.options.layout : layout;
            //save layout
            this.currentLayout = _layout;
            // rowed data
            let rowedData = this._calcRowData(this.data,_layout);
            // apply data to templateTable
            $element.empty().append(templateTable({rowedData:rowedData,type:"show",showExtra:options.showExtra}));
            // fadeIn effects for tds
            if(options.animate){
                let $tds = $element.find("[colId]");
                const timeDivide = Formflow.ANIMATETIME / $tds.size();
                $tds
                    .hide()
                    .each((index,td) => {
                        $(td).fadeIn(timeDivide * index)
                    })
            }
        }

        /**
         * base container's width adjust col's width
         * @param width : must be pixel
         * @private
         */
        _setContainerWidth(width) {
            let options = this.options,rowedData = this.rowedData;
            const allColSpace = this.currentLayout * 2;
            rowedData.forEach( row => {
                if(typeof options.kWidth === 'number') {
                    // because of kWidth is scale number
                    let divisor = (allColSpace - row.length) + row.length * options.kWidth;
                    row.forEach(col => {
                        col.kWidth = (options.kWidth * (1 / divisor)) * 100 + "%";
                        col.vWidth = (1 / divisor * col.vColspan) * 100 + "%"
                    })
                }else if(typeof options.kWidth === 'string') {
                    const containerWidth = width;
                    // vLeftWidth is container's width - all certain kWidth
                    let vLeftWidth = containerWidth - row.length * parseInt(options.kWidth);
                    row.forEach(col => {
                        col.kWidth = options.kWidth;
                        col.vWidth = (vLeftWidth / row.length)+"px";
                    })
                }
            })
        }

        /**
         * resize emmmmm
         * @param width - given width replace element's width
         * @private
         */
        _resizeDom (width){
            let $element = this._element,options = this.options,data = this.data;
            if (typeof options.kWidth === 'string'){
                Logger.debug("resizing dom ...");
                this._setContainerWidth(width || $element.width());
                let $tds = $element.find("[colId]");
                $tds.each((index,td) => {
                    if(index % 2 === 0){
                        $(td).width(data[Math.floor(index/2)].kWidth);
                    }else{
                        $(td).width(data[Math.floor(index/2)].vWidth);
                    }
                })
            }
        }

        _enableAutoReszie() {
            $(window).on(EVENT.RESIZE,() => {
                this._resizeDom();
            })
        }


        /**
         * calculate pos for every single data
         * @param data
         * @param layout
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
                    rowedData.push(row = []);
                    i = colspan
                }else{
                    i = i + colspan
                }

                // backup origin  kColspan and vColspan with _ prefix.
                col._kColspan = col.kColspan;
                col._vColspan = col.vColspan = colspan * 2  - col.kColspan;
                row.push(col)
            });

            this.rowedData = rowedData;
            // expand last col to row's end
            this._expandSpace();

            //use width property with % unit
            this._setContainerWidth($element.width());
            Logger.debug("calcRowData",rowedData);
            return rowedData
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
                let emptyColNum = options.layout * 2;
                row.forEach( col => {
                    emptyColNum = emptyColNum - col.kColspan - col.vColspan
                });
                if(emptyColNum > 0)
                    row[row.length - 1].vColspan = row[row.length - 1].vColspan + emptyColNum
            });
            return rowsData
        }

        _formatColData(data) {
           data = $.extend({},Formflow.defaultMetaOptions(),data);
           return data
        }

        setData(data){
            let self = this;
            this.data = []; // show data right now
            this.hidedata = []; // toggle show
            Logger.debug("invoke setData function");
            data = $.extend(true,[],data);
            //judge simple data or groups data
            if(!$.isArray(data) && typeof data === 'object' && typeof data.show !== 'undefined' && data.hide !== 'undefined'){
                // bind show data to plugin
                this.data = data.show;
                this.hidedata = data.hide;
            }else if($.isArray(data)){
                // bind show data to plugin
                this.data = data;
            }else{
                throw Error("your data format not correct!!")
            }
            // sort data
            self._sortDatabyIndex(this.data);
            self._sortDatabyIndex(this.hidedata);
            Logger.debug("sortbyIndex data:",this.data);

            // format data
            this.data.forEach((val,index) => {
                this.data[index] = self._formatColData(val)
            });
            this.hidedata.forEach((val,index) => {
                this.hidedata[index] = self._formatColData(val)
            });

            Logger.debug("merged data:",this.data)
            Logger.debug("merged hidedata:",this.hidedata)
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
         * @param isClone
         * @returns {*|null}
         */
        getColbyId(id,isClone = true) {
            let col;
            this.data.forEach( item => {
                if(item.id === id)  {
                    col = item
                }
            });
            return typeof col !== 'undefined' ? isClone ? $.extend(true,{},col) : col : null;
        }

        /**
         * update col by col's id
         * @param col
         * @returns {boolean}
         */
        updateCol(col) {
            // must have id
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
            // toggle loading state
            col.querying = false;

            let targetCol = this.getColbyId(sourceId);
            if(targetCol){
                $.extend(targetCol,col);
                // since now just update two show segments
                this._setDomValue(this._getDom(targetCol.id,"value"),targetCol.vText);
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

        /**
         * update dom's inner html
         * @param $dom
         * @param val
         * @private
         */
        _setDomValue($dom,val) {
            let options = this.options;
            if(options.animate){
                $dom.html(val).hide();
                $dom.fadeIn(Formflow.ANIMATETIME)
            }else{
                $dom.html(val)
            }
        }

        /**
         * sort by col's index asc
         * @param data
         * @returns {Array}
         */
        _sortDatabyIndex(data) {
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
                weight:1, // ta=ke default space
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
                let data = $element.data(DATA_KEY);
                if(!data){
                    data = new Formflow($element,_config);
                    $element.data(DATA_KEY,data);
                }
                if(typeof methodName === 'string'){
                    if(data[config] === 'undefined'){
                        throw new TypeError(`No method "${config}"`)
                    }
                    returnValue= data[methodName].apply(data,params)
                }
            });
            return typeof returnValue === 'undefined' ? this : returnValue
        }
    }

    // the index of index and groupstart
    Formflow.INDEXSTART = 0;

    //animate durations ms unit
    Formflow.ANIMATETIME = 1500;

    Formflow.defaultOptions = {
        layout:4, // layout cols is 4
        kWidth:"200px",// pixel or scale
        showExtra:false, // immediately show extra data
        animate:true, // enable animate ?
        autoResize:false // auto adjust width by adapt outer container
    };

    $.fn[NAME] = Formflow._jQueryInterface;
    $.fn[NAME].Constructor = Formflow;
    return Formflow;
})($);

export default Formflow;






