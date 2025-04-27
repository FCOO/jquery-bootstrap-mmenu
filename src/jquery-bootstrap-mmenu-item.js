/****************************************************************************

    jquery-bootstrap-mmenu-item.js,

****************************************************************************/

(function ($, Mmenu, i18next, window, document, undefined) {
    "use strict";

    //clone( elem ) return a cloned copy of elem
    function clone(elem){
        var result;
        if (Array.isArray(elem)){
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

    function emptyFunction(){}


    /************************************************
    Overwrite _initNavbar to add content that are translated correct
    ************************************************/
    Mmenu.prototype._initNavbar = function (_initNavbar) {
        return function(panel){
            _initNavbar.call(this, panel);

            var parentLiId = panel['mmParent'] ? panel['mmParent'].getAttribute('id') : null,
                bsMenu = this.conf.bsMenu,
                parentItem = parentLiId ? bsMenu._getItem(parentLiId, bsMenu, true) : null;
            if (parentItem)
                $(panel).find('.mm-navbar__title')
                    .empty()
                    ._bsAddHtml({
                        icon: parentItem.options.icon,
                        text: parentItem.options.text
                    });
        };
    }(Mmenu.prototype._initNavbar);

    /************************************************
    BsMmenuItem

    options for menuItems:
    MENUITEMOPTIONS = {
        id: STRING

        type: STRING    = none, "text", "button", "checkbox", or "radio". "text" is only for no-child items
        state: true, false or STRING/NUMBER/OBJECT: true: selected, false:unselected, other:semi-selected

        addToBar: BOOLEAN, if true a squire button is added to the bar that closes all other menus and open this one
        list/items/itemList: []MENUITEMOPTIONS = Sub-menu-items
    }
    ************************************************/
    var nextId = 0,
        nextLiId = 0;

    $.BsMmenuItem = function(options, parent, owner){

        owner = owner || this;
        this.options = options;

        this.id = options.id || 'bsmm_'+nextId++;
        this.type = (options.type || '').toLowerCase();
        this.type = this.type == 'check' ? 'checkbox' : this.type;
        this.hasCheckbox = (this.type == 'checkbox') || (this.type == 'radio');

        this.type = ['button', 'buttons', 'buttonlist'].includes(this.type) ? 'buttons' : this.type;
        this.isButtons = this.type == 'buttons';
        this.isLink = !!this.options.link;

        //If type = button and no buttons are given in buttonList/buttons => add one
        if (this.isButtons && (!this.options.buttonList || !this.options.buttonList.length) && !this.options.buttons)
            this.options.buttonList = [{
                icon     : this.options.icon,
                iconClass: this.options.iconClass,
                text     : this.options.text,
                onClick  : this.options.onClick
            }];

        this.buttonPaddingLeft  = this.isButtons && options.buttonPaddingLeft;
        this.buttonPaddingRight = this.isButtons && options.buttonPaddingRight;

        this.prev = null;
        this.next = null;
        this.first = null;
        this.last = null;
        this.parent = parent;
        this.menu = parent.menu;

        //Use forced events if given
        if (options.onChange && this.menu.options.forceOnChange)
            options.onChange = this.menu.options.forceOnChange;
        if (options.onClick && this.menu.options.forceOnClick)
            options.onClick = this.menu.options.forceOnClick;

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

        options.getState = options.getState || this.menu.options.getState || null;

        //Set element ids
        nextLiId++;
        this.liId       = 'bsmm_li_'+nextLiId;
        this.checkboxId = 'bsmm_cb_'+nextLiId;
        this.ulId       = 'bsmm_ul_'+nextLiId;

        //Create the DOM-element
        this.createLi(owner);

        //Append the DOM-element to the parent ul
        this.parent._createUl();
        this.$li.appendTo(this.parent.$ul);

        //Add sub-iterms (if any)
        var list = this.options.list || this.options.items || this.options.itemList || [];
        if (list.length)
            this._createUl();

        list.forEach( opt => this.append($.bsMmenuItem(opt, this)), this );
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
            var content;
            owner = owner || this;

            this.$li = $('<li/>')
                .attr('id', this.liId)
                .toggleClass('only-buttons', !!this.isButtons)
                .toggleClass('no-padding-right', !!this.isButtons && !!this.buttonPaddingRight);


            this.liElem   = this.$li.get(0);
            var $outer    = this.$outer = $('<span/>').appendTo(this.$li);

            if (!this.isButtons){
                if (this.isLink)
                    this.$content = $('<a/>').addClass('mm-listitem-link');
                else
                    this.$content = $('<div/>');

                this.$content
                        .addClass('d-flex align-items-center')
                        .appendTo(this.$outer);

                if (this.isLink)
                    this.$content
                        .i18n(this.options.link, 'href')
                        .prop('target', '_blank');

                if (this.options.simpleFullWidth)
                    this.$content.addClass('simple-full-width');

                var originalContent = this.options.content || this.options,
                    adjustIcon = this.menu.options.adjustIcon;

                if (originalContent && originalContent.icon && adjustIcon)
                    originalContent.icon = adjustIcon(originalContent.icon);

                let onClick = owner._onClick.bind(owner);

                content = clone(originalContent);
                content = Array.isArray(content) ? content : [content];

                //If first content-item is the text => make it full-width inside a div. Adjust the icon if menu.options.adjustIcon = function(icon) is given
                var firstContent = content[0];

                if (firstContent.onClick)
                    firstContent.onClick = onClick;

                if ( $.isPlainObject(firstContent) && (!firstContent.type || (firstContent.type == 'text')) )
                    content[0] = $('<div/>')._bsAddHtml(firstContent);

                //To prevent empty menu-items to open the sub-menu of its 'nearest' sibling (Bug in mmenu?) an empty click is added
                var list = this.options.list || this.options.items || this.options.itemList || [];
                if (!list.length)
                    this.$li.on('click', emptyFunction);

                if (this.first || !this.hasCheckbox){
                    this.$content
                        .toggleClass('mm-listitem-content', this.type == 'text')
                        ._bsAddHtml(content);
                }
                else {
                    this.checkbox = $.bsCheckbox({
                        id          : this.checkboxId,
                        type        : this.type,
                        multiLines  : true,
                        icon        : this.options.icon,
                        text        : this.options.text,
                        content     : content,
                        onClick     : onClick
                    })
                    .appendTo( this.$content );

                    //Set flex shrink to 0 for input-element
                    this.checkbox.find('input').addClass('flex-shrink-0');

                    //width = 100% for container label
                    this.checkbox.find('label').addClass('w-100');

                    this.setState(this.state);
                }

                if (this.options.link || this.checkbox){

                    //Add button to toggle favorites
                    if (this.menu.options.favorites && !this.options.noFavoriteButton){
                        var inFavorites = this.menu.options.favorites.get(this.id);
                        this.$favoriteButton =
                           $.bsIconCheckboxButton({
                                id          : this.id,
                                icon        : this.menu.favoriteIcon,
                                title       : {da:'Tilføj til/fjern fra Favoritter', en:'Add to/Remove from Favorites'},
                                transparent : true,
                                square      : true,
                                noBorder    : true,
                                class       :'flex-shrink-0 mm-favorite-icons',
                                selected    : inFavorites,
                                onChange    : this._toggleFavorite.bind(this)
                            }).appendTo(this.$outer);

                        this.$outer.addClass('pe-0');

                        if (inFavorites)
                            this.toggleFavorite(inFavorites);
                    }

                    //Add button to remove from Favorites
                    if (this.options.removeFavoriteButton){
                        $.bsButton({
                            id          : this.id,
                            icon        : this.menu.removeFavoriteIcon,
                            title       : {da:'Fjern fra Favoritter', en:'Remove from Favorites'},
                            transparent : true,
                            square      : true,
                            noBorder    : true,
                            class       :'flex-shrink-0 mm-favorite-icons',
                            onClick     : owner._toggleFavorite.bind(owner)
                        }).appendTo(this.$outer);
                        this.$outer.addClass('pe-0');
                    }
                }
            }   //end of if (!this.isButtons){

            //Add buttons from this.options.buttonList (if any)
            var buttonList = this.options.buttonList || this.options.buttons,
                groupList = [],
                buttonBarJustify = this.options.buttonJustify || this.parent.options.buttonJustify || 'center',
                paddingClass = '';

            if (this.hasCheckbox || this.buttonPaddingLeft)
                paddingClass = paddingClass + ' padding-left';
            if (this.$favoriteButton || this.options.removeFavoriteButton || this.buttonPaddingRight)
                paddingClass = paddingClass + ' padding-right';

            if (buttonList && !this.menu.options.noButtons){
                //Buttons added inside button-bar. If button-options have first: true => new 'line' = new bsButtonGroup
                var currentList = [];

                buttonList.forEach( buttonOptions => {
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
                    $.bsButtonBar({
                        small          : true,
                        buttons        : list,
                        class          : 'button-bar-container ' + paddingClass + ' d-flex flex-row flex-nowrap justify-content-'+buttonBarJustify,
                        buttonFullWidth: true,
                    }).appendTo($outer);
                });

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
        _reset
        Reset/unselect self and all sub-menus
        ***********************************/
        _reset: function(){
            if (this.hasCheckbox && this.state){
                //Use special reset-state if given
                var resetState = this.menu.options.reset.resetState;
                if (resetState !== undefined)
                    this.state = resetState;
                this._onClick();
            }

            var menuItem = this.first;
            while (menuItem){
                menuItem._reset();
                menuItem = menuItem.next;
            }
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
        _getParentIndex
        Get the index of the item in its parents list
        ***********************************/
        _getParentIndex: function(){
            var result = -1;
            if (this.parent){
                var nextItem = this.parent.first;
                while (nextItem){
                    result++;
                    nextItem = nextItem === this ? null : nextItem.next;
                }
            }
            return result;
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
                    //Use options.favotiteXX is given
                    var favoriteOptions = $.extend(true, {}, this.options, {
                            icon     : this.options.favoriteIcon      || this.options.icon      || null,
                            iconClass: this.options.favoriteIconClass || this.options.iconClass || null,
                            text     : this.options.favoriteText      || this.options.text      || null
                    });

                    favoriteOptions.id = null;
                    favoriteOptions.noFavoriteButton = true;
                    favoriteOptions.removeFavoriteButton = true;

                    delete favoriteOptions.selected;
                    delete favoriteOptions.semiselected;
                    favoriteOptions.state = this.state;
                    favoriteOptions.content = clone(favoriteOptions.content);

                    this.favoriteItem = $.bsMmenuItem(favoriteOptions, this.menu.favoritesItem, this);
                    this.favoriteItem.menuItem  = this;
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
        _getChildIndex
        Get the index of childItem
        ***********************************/
        _getChildIndex: function( childItem ){
            let index = 0,
                nextItem = this.first;
            while (nextItem){
                if (nextItem === childItem)
                    return index;
                else {
                    nextItem = nextItem.next;
                    index++;
                }
            }
            return -1;
        },

        /***********************************
        _getPlacement
        Return a array with the index of this in it parents for this and all is parent elements
        ***********************************/
        _getPlacement: function(){
            let getChildIndex = function( childItem, placement = [] ){
                let parent = childItem.parent;
                if (parent){
                    let index = 0,
                        nextItem = parent.last;
                    while (nextItem){
                        if (nextItem === childItem){
                            placement.push(index);
                            return getChildIndex( parent, placement );
                        }
                        else {
                            nextItem = nextItem.prev;
                            index++;
                        }
                    }
                }
                return placement;
            };

            return getChildIndex( this );
        },


        /***********************************
        getSiblingItem( menu )
        Returns the equal item in a cloned or original menu
        ***********************************/
        getSiblingItem: function( menu ){
            return menu._getItemByPlacment( this._getPlacement() );
        },

        /***********************************
        open
        ***********************************/
        open: function(closeAllOther){
            if (closeAllOther)
                this.menu.closeAll();

            if (this.$ul)
                this._getApi().openPanel(this.$ul.get(0));

            //For unknown reasons this is also needed.....
            if (this.$li && this.$ul){
                this.$li.addClass('mm-listitem_opened');
                this.$ul.parent().removeClass('mm-hidden');
            }

        },

        /***********************************
        close
        ***********************************/
        close: function(){
            if (this.$ul)
                this._getApi().closePanel(this.$ul.get(0));

            //For unknown reasons this is also needed.....
            if (this.$li && this.$ul){
                this.$li.removeClass('mm-listitem_opened');
                this.$ul.parent().addClass('mm-hidden');
            }
        },
        /***********************************
        _onClick
        ***********************************/
        _onClick: function(/*id, state*/){
            //If the menu is a full clone => use the original menu to handle events
            if (this.menu.cloneOf && this.menu.options.isFullClone){
                let siblingItem = this.getSiblingItem( this.menu.cloneOf );
                if (siblingItem)
                    siblingItem._onClick.bind(siblingItem).apply(arguments);
                return;
            }

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
            this.state = this.options.getState ? this.options.getState(this, state) : state;
            if (this.checkbox)
                this.checkbox.cbxSetState(this.state);

            if (this.favoriteCheckbox)
                this.favoriteCheckbox.cbxSetState(this.state);

            if (callOnChange && this.options.onChange)
                this.options.onChange(this.id, this.state, this);

            //If the menu has any cloned menus => update the items
            if (this.menu.clones){
                let state = this.state;
                $.each(this.menu.clones, function(id, menu){
                    let menuItem = this.getSiblingItem( menu );
                    if (menuItem && menuItem.setState)
                        menuItem.setState( state, false );
                }.bind(this));
            }



            return this;
        },

    };

}(jQuery, this.Mmenu/*, this.i18next, this, document*/));