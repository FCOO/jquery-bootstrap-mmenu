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

            offCanvas      : true,   //https://mmenujs.com/docs/core/off-canvas.html

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
        inclBar    : BOOLEAN, if true a bar top-right with buttons from items with options.addToBar = true and favorites (optional) and close-all (if barCloseAll=true)
        barCloseAll: BOOLEAN, if true a top-bar button is added that closes all open submenus

        adjustIcon  : function(icon): retur icon (optional). Adjust the icon of each menu-items

    ************************************************/
    $.BsMmenu = function(options = {}, mmenuOptions = {}, configuration = {}){
        var _this = this;

        this.prev = null;
        this.next = null;
        this.first = null;
        this.last = null;

        this.ulId = 'bsmm_ul_0';

        //Setting and adjusting mmenuOptions = the options for Mmenu
        //Using sliding submenus and navbar with title if it is a touch device
        this.mmenuOptions =
            $.extend(true, {}, $.BSMMENU.defaultMmenuOptions, {
                slidingSubmenus: window.bsIsTouch,

                navbar    : {
                    add   : !!window.bsIsTouch || !!options.title,
                    title : options.title || ' ',
                },
/* mangler
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
                id      : '____FAVORITES___',
                icon    : [['fas text-checked fa-star fa-fw', $.FONTAWESOME_PREFIX_STANDARD + ' fa-star fa-fw']],
                text    : {da: 'Favoritter', en: 'Favorites'},
                addToBar: true,
                list    : []
            }, this);

            this.append(this.favoritesItem);
        }

        //Create and add sub-items
        var list = $.isArray(options) ? options : (options.list || options.items || options.itemList || []);
        $.each(list, function(index, opt){
           _this.append($.bsMmenuItem(opt, _this));
        });

    };


    $.bsMmenu = function(options, mmenuOptions){
        return new $.BsMmenu(options, mmenuOptions);
    };

    //bsMMenu as jQuery prototype
    $.fn.bsMmenu = function(options, mmenuOptions){
        return this.each(function() {
            if (!$.data(this, "bsMmenu"))
                new $.BsMmenu(options, mmenuOptions);
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
            this._createUl();
            this.$ul.appendTo($elem);

            $elem.addClass( $._bsGetSizeClass({baseClass: 'mm-menu', useTouchSize: true}) );

            if (this.options.inclBar){
                var buttonList = [];
                if (this.options.barCloseAll)
                    buttonList.push( $.bsButton({
                        icon   : 'fa-home',
                        title: {da:'Luk alle', en:'Close all'},
                        square : true,
                        tagName: 'div',
                        onClick: $.proxy(this.closeAll, this)}
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
                                onClick : $.proxy(item.open, item, true)
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

            this.configuration.bsMenu = this;
            this.mmenu = new Mmenu($elem.get(0), this.mmenuOptions, this.configuration );

            this.panel = $elem.find('#'+this.ulId).get(0);
            this.api = this.mmenu.API;

            $elem.data('bsMmenu', this.mmenu);

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
        remove
        **********************************/
        remove: function(idOrItem){
            var item = typeof idOrItem == 'string' ? this.getItem(idOrItem) : idOrItem;
            if (item)
                item.remove();
            return item;
        },

        /**********************************
        closeAll
        **********************************/
        closeAll: function(){
            this.api.closeAllPanels();
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
        }
    };

    /******************************************
    Initialize/ready
    *******************************************/
    $(function() {

    });
}(jQuery, this.Mmenu, this.i18next, this, document));