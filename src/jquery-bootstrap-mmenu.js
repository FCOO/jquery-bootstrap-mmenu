/****************************************************************************
    jquery-bootstrap-mmenu.js,

    (c) 2021, FCOO

    https://github.com/FCOO/jquery-bootstrap-mmenu
    https://github.com/FCOO

****************************************************************************/

(function ($, Mmenu, i18next, window/*, document, undefined*/) {
    "use strict";

    //Create $.BSMMENU = record with const etc.
    //All options marked with (*) are set to its default value when creating the mmenu
    $.BSMMENU = {
        defaultMmenuOptions: {
            //OPTIONS FOR MMENU
            counters       : false,
            //(*)slidingSubmenus: false,   //Whether or not submenus should come sliding in from the right.
                                           //If false, submenus expand below their parent. To expand a single submenu below its parent item, add the class "Vertical" to it.

            offCanvas      : false, //https://mmenujs.com/docs/core/off-canvas.html

            preventDefault : true,
            extensions: [
                "multiline"
            ],

            /*
            In larger menus, with lots of sub-, sub-sub- and sub-sub-submenus,
            the time it takes to create the menu can be significantly reduced with the "lazySubmenus" add-on
            */
            lazySubmenus: {
                load: false //Whether or not to lazy load submenus.
            },


            //setSelected
            setSelected: {
                current: false, //Whether or not to make the current menu item appear "selected". Set to "detect" if you want the current menu item to be automatically found based on the URL.
                hover  : false,  //Whether or not to make menu item appear "selected" onMouseOver.
                parent : false, //Whether or not to make menu item appear "selected" while its subpanel is opened.
            },


            //Events
            onOpenOrClose: null, //function(menuItem, open, menu)
            forceOnChange: null, //function(menuItem, state, menu) Overwrites any onChange given. Normally used in cloned menues
            forceOnClick : null, //function(menuItem, state, menu) Overwrites any onClick given. Normally used in cloned menues
            /*
            navbar - see https://mmenujs.com/docs/addons/navbars.html
            */
            navbar    : {
                add   : true,   //Whether or not to add a navbar above the panels: true if slidingSubmenus: true or title != ""
                sticky: false,  //Whether or not the navbars should be sticky.
                title : ' ',    //The title for the main panel.
                //titleLink       //The type of link to set for the title. Possible values: "parent", "anchor" or "none".
            },

            backButton: {
                    // back button options
            }
        },

        className_inset     : 'bsmmenu_inset',      //The classname on a submenu (a nested UL) that should be displayed as a default list.
        className_panel     : 'bsmmenu_panel',      //The classname on an element (for example a DIV) that should be considered to be a panel.
        className_selected  : 'selected',           //The classname on the LI that should be displayed as selected.
        className_vertical  : 'bsmmenu_vertical',   //The classname on a submenu (a nested UL) that should expand below their parent instead of slide in from the right.

        configuration: {
            classNames: {
                //(*)inset     : className_inset,
                //(*)panel     : className_panel,
                //(*)selected  : className_selected,
                //(*)vertical  : className_vertical,
            }
        }
    };


    /************************************************
    BsMmenu
    options = {
        favorites = false or {
            get   : function(id) - return true if menu-item with id is added to favorites
            add   : function(id) - called when menu-item with id is added to favorites
            remove: function(id) - called when menu-item with id is removed from favorites
        }
        inclBar    : BOOLEAN, if true a bar top-right with buttons from items with options.addToBar = true and favorites (optional) and close-all (if barCloseAll=true) and reset (if options.reset is given)
        barCloseAll: BOOLEAN, if true a top-bar button is added that closes all open submenus

        noButtons   : BOOLEAN, if true no buttons are added to menu-items

        adjustIcon  : function(icon): retur icon (optional). Adjust the icon of each menu-items

        reset : NULL, true, false or {
            position  : STRING "top" or "bottom". Default = "top"
            icon      : STRING
            title     : STRING
            promise   : FUNCTION( resolve: function(clossAll:BOOLEAN) ) functions tha calls resolve(true/false) if all selected menu-items are to be unselected
            resetState: Object to be used when resetting an item with options.onChange instead of options.onClick
            finally   : FUNCTION( bsMenu ) (optional). Called after all menu-items are unselected
        }

    ************************************************/
    $.BsMmenu = function(options = {}, mmenuOptions = {}, configuration = {}){
        this.prev = null;
        this.next = null;
        this.first = null;
        this.last = null;

        this.favoriteIcon       = ['', 'fas text-checked fa-star', $.FONTAWESOME_PREFIX_STANDARD + ' fa-star'];
        this.removeFavoriteIcon = [[$.FONTAWESOME_PREFIX_STANDARD + ' fa-star fa-fw', $.FONTAWESOME_STANDARD + " fa-slash fa-fw"]];

        this.ulId = 'bsmm_ul_0';

        this.options = options;

        //Save mmenuOptions and configuration in options. Needed for clone
        this.options.mmenuOptions = mmenuOptions;
        this.options.configuration = configuration;

        //Setting and adjusting mmenuOptions = the options for Mmenu
        //Using sliding submenus and navbar with title if it is a touch device
        this.mmenuOptions =
            $.extend(true, {}, $.BSMMENU.defaultMmenuOptions, {
                slidingSubmenus: window.bsIsTouch,

                navbar    : {
                    add   : !!window.bsIsTouch || !!options.title,
                    title : options.title || ' ',
                },
/* @todo
                backButton: {
                    // back button options
                }
*/
            }, mmenuOptions);

        this.configuration =
            $.extend(true, {}, $.BSMMENU.configuration, {
                classNames: {
                    inset     : $.BSMMENU.className_inset,
                    panel     : $.BSMMENU.className_panel,
                    selected  : $.BSMMENU.className_selected,
                    vertical  : $.BSMMENU.className_vertical,
                }
            }, configuration);


        //Set and adjust options for the menu
        this.options = options;

        this.menu = this;

        this.favoriteId = '____FAVORITES___';

        //Craete ul to hold the menu
        this._createUl();

        //Adjust and add favorites
        if (this.options.favorites){
            if (this.options.favorites === true)
                this.options.favorites = {};

            this.options.favorites = $.extend({
                get   : function(/*id*/){ return false; },
                add   : function(/*id*/){},
                remove: function(/*id*/){}
            }, this.options.favorites);

            //Add menu-item with favorites
            this.favoritesItem = $.bsMmenuItem({
                id      : this.favoriteId,
                icon    : [['fas text-checked fa-star fa-fw', $.FONTAWESOME_PREFIX_STANDARD + ' fa-star fa-fw']],
                text    : {da: 'Favoritter', en: 'Favorites'},
                addToBar: true,
                list    : []
            }, this);

            this.append(this.favoritesItem);
        }

        //Create and add sub-items
        var list = Array.isArray(options) ? options : (options.list || options.items || options.itemList || []);
        list.forEach( opt => this.append($.bsMmenuItem(opt, this)), this );

        this.list = list;

    };


    $.bsMmenu = function(options, mmenuOptions, configuration){
        return new $.BsMmenu(options, mmenuOptions, configuration);
    };

    //bsMMenu as jQuery prototype
    $.fn.bsMmenu = function(options, mmenuOptions, configuration){
        return this.each(function() {
            if (!$.data(this, "bsMmenu"))
                new $.BsMmenu(options, mmenuOptions, configuration);
            $.data(this, "bsMmenu").create($(this));
        });
    };

    //Extend the prototype
    $.BsMmenu.prototype = {

        /***********************************
        append
        ***********************************/
        append: function(item){
            item.prev = this.last;
            item.next = null;
            if (this.last)
                this.last.next = item;
            this.last = item;
            this.first = this.first || item;
        },

        /***********************************
        _createUl
        ***********************************/
        _createUl: function(){
            this.$ul = this.$ul || $('<ul/>');
            this.$ul.attr('id', this.ulId);

        },

        /**********************************
        create
        **********************************/
        create: function($elem){
            var buttonList;
            this._createUl();
            this.$ul.appendTo($elem);

            $elem
                .addClass( $._bsGetSizeClass({baseClass: 'mm-menu', useTouchSize: true}) )
                .toggleClass('mm-menu-no-button', !!this.options.noButtons);


            if (this.options.inclBar){
                buttonList = [];
                if (this.options.barCloseAll)
                    buttonList.push( $.bsButton({
                        icon   : 'fa-home',
                        title: {da:'Luk alle', en:'Close all'},
                        square : true,
                        tagName: 'div',
                        onClick: this.closeAll.bind(this)}
                    ).get(0) );

                var item = this.first;
                while (item){
                    if (item.options.addToBar)
                        buttonList.push(
                            $.bsButton({
                                icon    : item.options.icon || 'fa',
                                title   : item.options.text || null,
                                square  : true,
                                tagName : 'div',
                                onClick : item.open.bind(item, true)
                            }).get(0)
                        );
                    item = item.next;
                }

                if (buttonList.length)
                    this.mmenuOptions.iconbar = {
                        use: true,
                        top: buttonList,
                        //bottom: []ELEMENT
                    };
            }
            else
                this.mmenuOptions.iconbar = false;

            //Add button to reset all selected menu-items (if any)
            if (this.options.reset){
                var resetOptions = this.options.reset = $.extend({
                        position  : "top",
                        icon      : 'fa fa-rotate-left',
                        title     : {da:'Nulstil', en:'Reset'},
                        promise   : function( resolve ){ resolve(); },
//                        resetState: false,
                        finally   : function(){}
                    }, this.options.reset === true ? {} : this.options.reset),

                    iconbar = this.mmenuOptions.iconbar = this.mmenuOptions.iconbar || {use: true};

                buttonList = iconbar[resetOptions.position] = iconbar[resetOptions.position] || [];
                buttonList.push(
                    $.bsButton({
                        icon    : resetOptions.icon,
                        title   : resetOptions.title,
                        square  : true,
                        tagName : 'div',
                        onClick : this.reset.bind(this)
                    }).get(0)
                );
            }

            this.configuration.bsMenu = this;
            this.mmenu = new Mmenu($elem.get(0), this.mmenuOptions, this.configuration );

            this.panel = $elem.find('#'+this.ulId).get(0);
            this.api = this.mmenu.API;

            //Add event for open/close menus. Other events: 'closePanel:before', 'closePanel:after', 'openPanel:before', 'openPanel:after', 'setSelected:before', 'setSelected:after'
            this.api.bind('openPanel:after',  this._onOpen.bind(this) );
            this.api.bind('closePanel:after', this._onClose.bind(this) );

            $elem.data('bsMmenu', this.mmenu);


            //Open item
            $.each(this.openItemIdList, function(id, isOpen){
                let item = this.getItem(id);
                if (item && isOpen)
                    item.open();
            }.bind(this));


            return this;
        },

        /**********************************
        _getItem
        **********************************/
        _getItem: function(id, parent, findByLiId){
            var item = parent.first,
                result = null;
            while (item){
                if ( (!findByLiId && (item.id   == id) ) ||
                     ( findByLiId && (item.liId == id) ) )
                    result = item;
                else
                    result = this._getItem(id, item, findByLiId);

                if (result)
                    item = null;
                else
                    item = item.next;
            }

            return result;
        },

        /**********************************
        getItem
        **********************************/
        getItem: function(id, findByLiId){
            return this._getItem(id, this, findByLiId);
        },

        /**********************************
        _getItemByPlacment
        **********************************/
        _getItemByPlacment( placement ){
            let getChildByIndex = function( parent, placement ){
                if (!placement.length || !parent)
                    return parent;

                let nextIndex = placement.pop(),
                    index = 0,
                    nextItem = parent.last;
                while (nextItem){
                    if (index == nextIndex)
                        return getChildByIndex( nextItem, placement );
                    else {
                        nextItem = nextItem.prev;
                        index++;
                    }
                }
                return null;
            };

            return getChildByIndex( this, placement );
        },



        /**********************************
        remove
        **********************************/
        remove: function(idOrItem){
            var item = typeof idOrItem == 'string' ? this.getItem(idOrItem) : idOrItem;
            if (item)
                item.remove();
            return item;
        },

        /**********************************
        reset
        **********************************/
        reset: function(){
            if (this.options.reset.promise)
                this.options.reset.promise( this._reset_resolve.bind(this) );
        },

        _reset_resolve: function( closeAll ){
            var menuItem = this.first;
            while (menuItem){
                if (menuItem.id != this.favoriteId)
                    menuItem._reset();
                menuItem = menuItem.next;
            }
            if (closeAll)
                this.closeAll();

            this.options.reset.finally(this);
        },

        /**********************************
        _onOpenClose
        **********************************/
        _onOpen: function(panel) { return this._onOpenOrClose(panel, true);  },
        _onClose: function(panel){ return this._onOpenOrClose(panel, false); },

        _onOpenOrClose( panel, isOpen=false){
            let liId      = panel.parentElement ? $(panel.parentElement).attr('id') : null,
                mmenuItem = liId ? this.getItem(liId, true) : null;

            if (mmenuItem){
                //Update openItemIdList
                this.openItemIdList = this.openItemIdList || {};
                this.openItemIdList[mmenuItem.id] = isOpen;

                if (this.options.onOpenOrClose)
                    this.options.onOpenOrClose(mmenuItem, isOpen, this);
            }

            return this;
        },

        /**********************************
        closeAll
        **********************************/
        closeAll: function(){
            this.api.closeAllPanels();
        },

        /**********************************
        favoriteRemoveAll
        **********************************/
        favoriteRemoveAll: function(){
            var item = this.favoritesItem ? this.favoritesItem.first : null;
            while (item){
                var nextItem = item.next;
                item.menuItem.toggleFavorite(false);
                item = nextItem;
            }
        },



        /**********************************
        _updateFavorites
        Update and sort the list of favorites
        ***********************************/
        _updateFavorites: function(){
            if (!this.favoritesItem) return;

            //Update index for all items
            var nextIndex = 0,
                item = this.favoritesItem.next;
            while (item){
                nextIndex = item._updateIndex(nextIndex);
                item = item.next;
            }

            //Move all items into a list and sort it
            var itemList = [];
            item = this.favoritesItem.first;
            while (item){
                itemList.push(item);
                item = item.next;
            }
            itemList.sort(function(itemA, itemB){ return itemA.index - itemB.index; });

            if (itemList.length){
                //Append favorite-items in sorted order
                this.favoritesItem.first = null;
                this.favoritesItem.last = null;

                //Re-append the items and re-arrange its li-element
                var _favoritesItem = this.favoritesItem,
                    $ul = this.favoritesItem.$ul;

                $.each(itemList, function(index, item){
                    item.prev = _favoritesItem.last;
                    item.next = null;
                    if (_favoritesItem.last)
                        _favoritesItem.last.next = item;
                    _favoritesItem.last = item;
                    _favoritesItem.first = _favoritesItem.first || item;

                    item.$li.detach().appendTo($ul);

                });
            }
        },

        /**********************************
        clone
        Create a cloned version of the menu
        ***********************************/
        clone: function( options = {}, mmenuOptions = {}, configuration = {}  ){

            options = $.extend({
                inclFavorites: false,
                noButtons    : true,
                inclBar      : false,
                reset        : false,
                favorites    : false,
                isFullClone  : true     //true => All items are an exact copy
            }, options);

            let c_options       = $.extend(true, {}, this.options,               options      ),
                c_mmenuOptions  = $.extend(true, {}, this.options.mmenuOptions,  mmenuOptions ),
                c_configuration = $.extend(true, {}, this.options.configuration, configuration);

            let c_menu = $.bsMmenu(c_options, c_mmenuOptions, c_configuration);

            this.nrOfClones = this.nrOfClones || 0;
            this.clones = this.clones || {};

            c_menu.cId = 'clone'+this.nrOfClones;
            c_menu.cloneOf = this;
            this.nrOfClones++;
            this.clones[c_menu.cId] = c_menu;

            //Copy the open/close state from the original menu
            c_menu.openItemIdList = {};
            $.each(this.openItemIdList, function(id, isOpen){
                let origialItem = this.getItem(id),
                    cloneItem = origialItem ? origialItem.getSiblingItem( c_menu ) : null;
                if (cloneItem)
                    c_menu.openItemIdList[cloneItem.id] = isOpen;
            }.bind(this));

            return c_menu;
        },

        /**********************************
        destroy
        Destroy the menu and clean up
        ***********************************/
        destroy: function(){
            if (this.cloneOf)
                delete this.cloneOf.clones[this.cId];
            $(this.mmenu.node.menu).empty();
        },

        /**********************************
        showInModal
        Show the menu in a modal
        ***********************************/
        showInModal: function(modalOptions = {}){

            let width = null;

            //If the menu is a clone and modalOptions.sameWidthAsCloneOf = true => the modal inner-wisth gets the same as the original menu
            if (this.cloneOf && modalOptions.sameWidthAsCloneOf && !modalOptions.width)
                width = this.cloneOf.$ul.width();
            else
                width = modalOptions.width;

            let offCanvas = this.mmenuOptions.offCanvas;
            this.mmenuOptions.offCanvas = false;

            this.bsModal = $.bsModal(
                $.extend( modalOptions, {
                    scroll   : true,
                    fitWidth : !!width,
                    flexWidth: !width,

                    content: function(modalOptions, $container){
                        let $outerContent =
                                $('<div></div>')
                                    .addClass('mm-menu-modal-content')
                                    .appendTo($container);

                        if (modalOptions.minHeight)
                            $outerContent.css('minHeight', modalOptions.minHeight);

                        if (width)
                            $outerContent.width(width);

                        let $content = $('<div></div>')
                                .appendTo($outerContent);

                        this.create($content);
                    }.bind(this, modalOptions),
                })
            );

            this.mmenuOptions.offCanvas = offCanvas;
        }
    };

    /******************************************
    Initialize/ready
    *******************************************/
    $(function() {

    });
}(jQuery, this.Mmenu, this.i18next, this, document));