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
        defaultOptions: {
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








    /******************************************
    BsMmenu
    *******************************************/
    $.BsMmenu = function(menuOptions, options, configuration){
//window.bsIsTouch
        //Using sliding submenus and navbar with title if it is a touch device
        this.options = this.options || {};
        this.options =
            $.extend(true, {}, $.BSMMENU.defaultOptions, {
                slidingSubmenus: window.bsIsTouch,

                navbar    : {
                    add   : !!window.bsIsTouch || !!this.options.title,
                    title : this.options.title || ' '
                },
/* mangler
                backButton: {
                    // back button options
                }
*/
            }, options || {});

        this.configuration =
            $.extend(true, {}, $.BSMMENU.configuration, {
                classNames: {
                    inset     : $.BSMMENU.className_inset,
                    panel     : $.BSMMENU.className_panel,
                    selected  : $.BSMMENU.className_selected,
                    vertical  : $.BSMMENU.className_vertical,
                }
            }, configuration || {});

        var _this = this,
            list = $.isArray(menuOptions) ? menuOptions : (menuOptions.list || menuOptions.items || menuOptions.itemList || []);

        $.each(list, function(index, opt){
            _this.append(new $.BsMmenuItem(opt));
        });
    };


    $.bsMmenu = function(menuOptions, options){
        return new $.BsMmenu(menuOptions, options);
    };

    //bsMMenu as jQuery prototype
    $.fn.bsMmenu = function(menuOptions, options){
        return this.each(function() {
            if (!$.data(this, "bsMmenu"))
                new $.BsMmenu(menuOptions, options);
            $.data(this, "bsMmenu").createElement($(this));
        });
    };

    //Extend the prototype
    $.BsMmenu.prototype = {

        //append
        append: function(item){
            this.list = this.list || [];
            item.menu = this;
            this.list.push(item);
            return this;
        },

        create: function($elem){
            var $ul = this.$ul = $('<ul/>').appendTo($elem);

            $elem.addClass( $._bsGetSizeClass({baseClass: 'mm-menu', useTouchSize: true}) );


            $.each(this.list, function(index, item){
                item.createElement($ul);
            });

            var mmenu = this.mmenu = new window.Mmenu($elem.get(0), this.options, this.configuration );

            this.api = mmenu.API;

            $elem.data('bsMmenu', mmenu);

            return this;
        },

        _getItem: function(id, list = []){
            var _this = this,
                result = null;
            $.each(list, function(index, item){
                if (item.id == id)
                    result = item;
                else
                    result = _this._getItem(id, item.list);

                return !result;
            });
            return result;
        },

        getItem: function(id){
            return this._getItem(id, this.list);
        },

        closeAll: function(){
            this.api.closeAllPanels();
        }

    };


    /******************************************
    BsMmenuItem
    *******************************************/
    var nextId = 0;
    $.BsMmenuItem = function(options){
        var _this = this;
        this.options = options;

        this.id = options.id || 'bsmm_'+nextId++;

        var list = this.options.list || [];
        $.each(list, function(index, opt){
            _this.append(new $.BsMmenuItem(opt));
        });
    };

var test = true;
    //Extend the prototype
    $.BsMmenuItem.prototype = {
        //append
        append: function(item){
            this.list = this.list || [];
            this.list.push(item);
        },

        //createElement
        createElement: function($parentUl){
            this.$li      = $('<li/>').appendTo($parentUl);
            this.liElem   = this.$li.get(0);
            this.$outer   = $('<span/>').appendTo(this.$li);
            this.$content = $('<span/>').appendTo(this.$outer);

            if (this.list || this.options.niels)
                this.$content._bsAddHtml(this.options);
            else {
                if (test)
                    $.bsCheckbox({
                        //semiSelected: true,
                        id: this.id,
                        icon: 'fa-home',
                        text: this.options.text,
                        onChange: function(/*id, selected/*, $buttonGroup*/){
                            //console.log('9: bsSelectListPopover', id, selected)
                        },
                    })
                    .appendTo( this.$content );
                else
                    $.bsCheckbox({
                        type: 'radio',
                        semiSelected: true,
                        disabled: true,
                        text: this.options.text,
                        onChange: function(/*id, selected/*, $buttonGroup*/){
                            //console.log('bsCheckbox as radio', id, selected)
                        },
                    })
                    .appendTo( this.$content );

                test = !test;

//MANGLER                if (true){
                    this.$favoriteButton =
                        $.bsIconCheckboxButton({
                            id  : this.id,
                            icon: ['', 'fas text-checked fa-star', 'far fa-star'],
                            title: {da:'Tilføj til/fjern fra Favoritter', en:'Add to/Remove from Favorites'},
                            transparent: true,
                            square     : true,
                            noBorder   : true,
                            onChange: $.proxy(this._toggleFavorite, this)
                        }).appendTo(this.$outer);
                    this.$outer.addClass('padding-right-none');
//MANGLER                }
            }

            //Create and append sub-items
            if (this.list)
                var $ul = this.$ul = $('<ul/>').appendTo(this.$li);

//                if (false)
//                    $ul.addClass($.BSMMENU.className_vertical);



                $.each(this.list, function(index, item){
                    item.createElement($ul);
                });
        },


        _getApi: function(){
            this.api = this.api || this.menu.api;
            return this.api;
        },

        _toggleFavorite: function(id, selected){
            this.toggleFavorite(selected);
        },
        toggleFavorite: function(/*selected*/){
//HERconsole.log(this.id, 'favorite', selected);
        },

        open: function(closeAllOther){
            if (closeAllOther)
                this.menu.closeAll();
            this._getApi.openPanel(this.liElem);
        }


    };

/********************************************************************
TILFØJ item og sub-list efter mmenu er dannet: https://mmenujs.com/tutorials/dynamic-content.html
********************************************************************/



    /******************************************
    Initialize/ready
    *******************************************/
    $(function() {

    });
}(jQuery, this.i18next, this, document));