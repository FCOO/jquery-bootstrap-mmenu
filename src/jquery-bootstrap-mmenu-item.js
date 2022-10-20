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


            var content = clone(this.options.content || this.options);

            content = $.isArray(content) ? content : [content];

            //If first content-item is the text => make it full-width inside a div
            var firstContent = content[0];
            if ( $.isPlainObject(firstContent) && (!firstContent.type || (firstContent.type == 'text')) )
                content[0] = $('<div/>')._bsAddHtml(firstContent);

            //Add buttons from this.options.buttonList (if any) to content (once)
            var buttonList = this.options.buttonList || this.options.buttons;
            if (buttonList){
                //Buttons added inside button-bar. If button-options have first: true => new 'line' = new bsButtonGroup
                var groupList = [],
                    currentList = [];

                buttonList.forEach( function(buttonOptions){
                    if (buttonOptions.isFirstButton && currentList.length){
                        groupList.push( currentList );
                        currentList = [];
                    }

                    currentList.push( buttonOptions );

                    if (buttonOptions.isLastButton){
                        groupList.push( currentList );
                        currentList = [];
                    }
                });

                if (currentList.length)
                    groupList.push( currentList );

                groupList.forEach( function( list ){
                    content.push(
                        $.bsButtonBar({
                            small   : true,
                            buttons : list,
                            justify : 'center'
                        })
                    );
                });
            }


            if (this.first || !this.hasCheckbox)
                this.$content
                    .toggleClass('mm-listitem-content', this.type == 'text')
                    ._bsAddHtml(content);
            else {
                this.checkbox = $.bsCheckbox({
                    id          : this.id,
                    type        : this.type,
                    multiLines  : true,
                    icon        : this.options.icon,
                    text        : this.options.text,
                    content     : content,
                    onClick     : $.proxy(owner._onClick, owner)
                })
                .appendTo( this.$content );

                //Set flex shrink to 0 for input-element
                this.checkbox.find('input').addClass('flex-shrink-0');

                //widrh = 100% for container label
                this.checkbox.find('label').addClass('w-100');

                this.setState(this.state);

                //Add button to toggle favorites
                if (this.menu.options.favorites && !this.options.noFavoriteButton){
                    var inFavorites = this.menu.options.favorites.get(this.id);
                    this.$favoriteButton =
                       $.bsIconCheckboxButton({
                            id          : this.id,
                            icon        : ['', 'fas text-checked fa-star', $.FONTAWESOME_PREFIX_STANDARD + ' fa-star'],
                            title       : {da:'Tilføj til/fjern fra Favoritter', en:'Add to/Remove from Favorites'},
                            transparent : true,
                            square      : true,
                            noBorder    : true,
                            class       :'flex-shrink-0',
                            selected    : inFavorites,
                            onChange    : $.proxy(this._toggleFavorite, this)
                        }).appendTo(this.$outer);

                    this.$outer.addClass('pe-0');

                    if (inFavorites)
                        this.toggleFavorite(inFavorites);
                }

                //Add button to remove from Favorites
                if (this.options.removeFavoriteButton){
                    $.bsButton({
                        id          : this.id,
                        icon        : [[$.FONTAWESOME_PREFIX_STANDARD + ' fa-star fa-fw', $.FONTAWESOME_STANDARD + " fa-slash fa-fw"]],
                        title       : {da:'Fjern fra Favoritter', en:'Remove from Favorites'},
                        transparent : true,
                        square      : true,
                        noBorder    : true,
                        onClick     : $.proxy(owner._toggleFavorite, owner)
                    }).appendTo(this.$outer);
                    this.$outer.addClass('pe-0');
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