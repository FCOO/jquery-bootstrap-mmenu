/****************************************************************************

    jquery-bootstrap-mmenu-item.js,

****************************************************************************/

(function ($/*, i18next, window, document, undefined*/) {
    "use strict";

    //clone( elem ) return a cloned copy of elem
    function clone(elem){
        var result;
        if ($.isArray(elem)){
            result = [];
            $.each(elem, function(index, subElem){
                result.push( clone(subElem) );
            });
        }
        else
            if ($.isPlainObject( elem ))
                result = $.extend(true, {}, elem);
            else
                if (elem instanceof HTMLElement)
                    result = elem.cloneNode(true);
                else
                    if (elem instanceof jQuery)
                        result = elem.clone(true);
                    else
                        result = elem;
        return result;
    }

    /************************************************
    BsMmenuItem

    options for menuItems:
    MENUITEMOPTIONS = {
        id: STRING

        type: STRING    = none, "text", "checkbox", or "radio". "text" is only for no-child items
        state: true, false or STRING/NUMBER/OBJECT: true: selected, false:unselected, other:semi-selected

        addToBar: BOOLEAN, if true a squire button is added to the bar that closes all other menus and open this one
        list/items/itemList: []MENUITEMOPTIONS = Sub-menu-items
    }
    ************************************************/
    var nextId = 0,
        nextLiId = 0;

    $.BsMmenuItem = function(options, parent, owner){
        var _this = this;
        owner = owner || this;
        this.options = options;

        this.id = options.id || 'bsmm_'+nextId++;
        this.type = (options.type || '').toLowerCase();
        this.type = this.type == 'check' ? 'checkbox' : this.type;
        this.hasCheckbox = (this.type == 'checkbox') || (this.type == 'radio');


        this.prev = null;
        this.next = null;
        this.first = null;
        this.last = null;
        this.parent = parent;
        this.menu = parent.menu;

        //Using global events (if any) if non is given
        if (!options.onChange && !options.onClick){
            options.onChange = this.menu.options.onChange || null;
            options.onClick  = this.menu.options.onClick  || null;
        }

        this.state = options.state;
        if (this.state || (this.state === false))
            /*ok*/;
        else {
            this.state = !!this.options.selected;
            if (this.state && this.options.semiSelected)
                this.state = 'semi';
        }

        //Set element ids
        nextLiId++;
        this.liId = 'bsmm_li_'+nextLiId;
        this.ulId = 'bsmm_ul_'+nextLiId;

        //Create the DOM-element
        this.createLi(owner);

        //Append the DOM-element to the parent ul
        this.parent._createUl();
        this.$li.appendTo(this.parent.$ul);

        //Add sub-iterms (if any)
        var list = this.options.list || this.options.items || this.options.itemList || [];
        if (list.length)
            this._createUl();
        $.each(list, function(index, opt){
            _this.append($.bsMmenuItem(opt, _this));
        });
    };

    $.bsMmenuItem = function(options, parent, owner){
        return new $.BsMmenuItem(options, parent, owner);
    };

    //Extend the prototype
    $.BsMmenuItem.prototype = {
        /***********************************
        createLi
        ***********************************/
        createLi: function(owner){
            owner = owner || this;

            this.$li      = $('<li/>');
            this.$li.attr('id', this.liId);

            this.liElem   = this.$li.get(0);
            this.$outer   = $('<span/>').appendTo(this.$li);
            this.$content = $('<div/>').appendTo(this.$outer);

            if (this.first || !this.hasCheckbox){
                this.$content
                    .toggleClass('mm-listitem-content', this.type == 'text')
                    ._bsAddHtml(this.options.content || this.options);
            }
            else {
                this.checkbox = $.bsCheckbox({
                    id          : this.id,
                    type        : this.type,
                    icon        : 'fa-home',
                    multiLines  : true,
                    text        : this.options.text,
                    content     : this.options.content,
                    onClick     : $.proxy(owner._onClick, owner)
                })
                .appendTo( this.$content );

                this.setState(this.state);

                //Add button to toggle favorites
                if (this.menu.options.favorites && !this.options.noFavoriteButton){
                    var inFavorites = this.menu.options.favorites.get(this.id);
                    this.$favoriteButton =
                       $.bsIconCheckboxButton({
                            id  : this.id,
                            icon: ['', 'fas text-checked fa-star', 'far fa-star'],
                            title: {da:'Tilføj til/fjern fra Favoritter', en:'Add to/Remove from Favorites'},
                            transparent: true,
                            square     : true,
                            noBorder   : true,
                            selected   : inFavorites,
                            onChange   : $.proxy(this._toggleFavorite, this)
                        }).appendTo(this.$outer);
                    this.$outer.addClass('padding-right-none');

                    if (inFavorites)
                        this.toggleFavorite(inFavorites);
                }

                //Add button to remove from Favorites
                if (this.options.removeFavoriteButton){
                    $.bsButton({
                        id          : this.id,
                        icon        : [['far fa-star fa-fw', "fa fa-slash fa-fw"]],
                        title       : {da:'Fjern fra Favoritter', en:'Remove from Favorites'},
                        transparent : true,
                        square      : true,
                        noBorder    : true,
                        onClick     : $.proxy(owner._toggleFavorite, owner)
                    }).appendTo(this.$outer);
                    this.$outer.addClass('padding-right-none');
                }
            }
        },

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
            item.parent = this;
            item.menu = this.menu;
            item._updateElement();
        },

        /***********************************
        prepend
        ***********************************/
        prepend: function(item){
            item.prev = null;
            item.next = this.first;
            if (this.first)
                this.first.prev = item;
            this.first = item;
            this.last = this.last || item;
            item.parent = this;
            item.menu = this.menu;
            item._updateElement();
        },


        /***********************************
        insertBefore
        Insert this before item
        ***********************************/
        insertBefore: function(item){
            this.next = item;
            this.prev = item.prev;
            item.prev = this;
            this.parent = item.parent;
            this._updateElement();
        },

        /***********************************
        insertAfter
        Insert this after item
        ***********************************/
        insertAfter: function(item){
            this.prev = item;
            this.next = item.next;
            item.next = this;
            this.parent = item.parent;
            this._updateElement();
        },


        /***********************************
        remove
        Remove the item and its element (if any) from its parent
        ***********************************/
        remove: function(){
            if (this.prev)
                this.prev.next = this.next;
            else
                this.parent.first = this.next;

            if (this.next)
                this.next.prev = this.prev;
            else
                this.parent.last = this.prev;

            if (this.$li)
                this.$li.detach();

            //If a item is going from sub-items to no sub-items the cheveron still exists.
            //As a bug fix the parent item is re-created if there is no more children
            if (!this.parent.first){
                this.parent.$ul.remove();
                this.parent.$ul = null;
                var oldLi = this.parent.$li;
                oldLi.attr('id', 'NOT');
                this.parent.createLi();
                this.parent.$li.insertAfter(oldLi);
                oldLi.remove();
            }

            if (this.menu.mmenu){
                this._getApi().initPanel(this.menu.panel);
                this._getApi().initListview( this.parent.parent.$ul.get(0) );
            }

            this.parent = null;
            this.prev   = null;
            this.next   = null;

            return this;
        },


        /***********************************
        _createUl
        ***********************************/
        _createUl: function(){
            this.$ul = this.$ul || $('<ul/>').appendTo(this.$li);
            this.$ul.attr('id', this.ulId);

            return this;
        },

        /***********************************
        _updateIndex
        Update this.index and all sub-items index
        ***********************************/
        _updateIndex: function(nextIndex){
            this.index = nextIndex;
            if (this.favoriteItem)
                this.favoriteItem.index = nextIndex;
            nextIndex++;
            var item = this.first;
            while (item){
                nextIndex = item._updateIndex(nextIndex);
                item = item.next;
            }
            return nextIndex;
        },

        /***********************************
        _updateElement
        Insert this.$li in DOM
        ***********************************/
        _updateElement: function(){

            this.parent._createUl();

            if (this.$li){
                if (this.prev)
                    this.$li.insertAfter(this.prev.$li);
                else
                    if (this.next)
                        this.$li.insertBeforeAfter(this.next.$li);
                    else
                        this.parent.$ul.append(this.$li);

                //(Re)initialize the menu. See https://mmenujs.com/tutorials/dynamic-content.html
                if (this.menu.mmenu){
                    this._getApi().initListview( this.parent.$ul.get(0) );
                    this._getApi().initPanel( this.menu.panel );
                }
            }

            this.menu._updateFavorites();

            return this;
        },

        /***********************************
        _getApi
        ***********************************/
        _getApi: function(){
            this.api = this.api || this.menu.api;
            return this.api;
        },


        /***********************************
        _toggleFavorite
        ***********************************/
        _toggleFavorite: function(id, selected){
            this.toggleFavorite(selected);
        },

        /***********************************
        toggleFavorite
        ***********************************/
        toggleFavorite: function(selected){
            this.inFavorites = selected;

            //Update saved info on favorites
            var favorites = this.menu.options.favorites;
            if (selected)
                favorites.add(this.id);
            else
                favorites.remove(this.id);

            if (selected){
                if (!this.favoriteItem){
                    //Create the 'copy' menu-item to add to favorites
                    var favoriteOptions = $.extend(true, {}, this.options);

                    favoriteOptions.id = null;
                    favoriteOptions.noFavoriteButton = true;
                    favoriteOptions.removeFavoriteButton = true;

                    delete favoriteOptions.selected;
                    delete favoriteOptions.semiselected;
                    favoriteOptions.state = this.state;
                    favoriteOptions.content = clone(favoriteOptions.content);

                    this.favoriteItem = $.bsMmenuItem(favoriteOptions, this.menu.favoritesItem, this);
                    this.favoriteItem._updateElement();
                    this.favoriteCheckbox = this.favoriteItem.checkbox;
                }
                this.menu.favoritesItem.append(this.favoriteItem);
            }
            else
                this.favoriteItem.remove();

            //Update star-button
            this.$favoriteButton._cbxSet(selected, true);


            this.menu._updateFavorites();
        },

        /***********************************
        open
        ***********************************/
        open: function(closeAllOther){
            if (closeAllOther)
                this.menu.closeAll();
            if (this.$ul)
                this._getApi().openPanel(this.$ul.get(0));
        },


        /***********************************
        _onClick
        ***********************************/
        _onClick: function(/*id, state*/){
            //There are two ways to change the state:
            //options.onChange => simple true/false state
            //options.onClick(id, state, item) => onClick will do all setting
            if (this.options.onChange){
                this.toggleState();
                this.options.onChange(this.id, this.state, this);
            }
            else
                if (this.options.onClick)
                    this.options.onClick(this.id, this.state, this);

        },

        /***********************************
        setSelected
        ***********************************/
        setSelected: function(callOnChange){
            return this.setState(true, callOnChange);
        },

        /***********************************
        setUnselected
        ***********************************/
        setUnselected: function(callOnChange){
            return this.setState(false, callOnChange);
        },

        /***********************************
        setSemiSelected
        ***********************************/
        setSemiSelected: function(callOnChange){
            return this.setState('semi', callOnChange);
        },

        /***********************************
        toggleState
        ***********************************/
        toggleState: function(callOnChange){
            return this.setState(!this.state, callOnChange);
        },

        /***********************************
        setState
        ***********************************/
        setState: function(state, callOnChange){
            this.state = state;
            if (this.checkbox)
                this.checkbox.cbxSetState(state);

            if (this.favoriteCheckbox)
                this.favoriteCheckbox.cbxSetState(state);

            if (callOnChange && this.options.onChange)
                this.options.onChange(this.id, this.state, this);

            return this;
        },

    };


    /******************************************
    Initialize/ready
    *******************************************/
    $(function() {

    });
}(jQuery/*, this.i18next, this, document*/));
;
/****************************************************************************
    jquery-bootstrap-mmenu.js,

    (c) 2021, FCOO

    https://github.com/FCOO/jquery-bootstrap-mmenu
    https://github.com/FCOO

****************************************************************************/

(function ($, i18next, window/*, document, undefined*/) {
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
                    title : options.title || ' '
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
                icon    : [['fas text-checked fa-star fa-fw', 'far fa-star fa-fw']],
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

            this.mmenu = new window.Mmenu($elem.get(0), this.mmenuOptions, this.configuration );

            this.panel = $elem.find('#'+this.ulId).get(0);

            this.api = this.mmenu.API;
            $elem.data('bsMmenu', this.mmenu);

            return this;
        },

        /**********************************
        _getItem
        **********************************/
        _getItem: function(id, parent){
            var item = parent.first,
                result = null;
            while (item){
                if (item.id == id)
                    result = item;
                else
                    result = this._getItem(id, item);

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
        getItem: function(id){
            return this._getItem(id, this);
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
}(jQuery, this.i18next, this, document));