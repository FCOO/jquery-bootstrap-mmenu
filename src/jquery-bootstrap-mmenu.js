/****************************************************************************
	jquery-bootstrap-mmenu.js, 

	(c) 2021, FCOO

	https://github.com/FCOO/jquery-bootstrap-mmenu
	https://github.com/FCOO

****************************************************************************/

(function ($, window, document, undefined) {
	"use strict";
	
	//Create fcoo-namespace
	window.fcoo = window.fcoo || {};

	//If fcoo.namespace() is defined create a name-space
	var ns = window.fcoo.namespace ? window.fcoo.namespace(''/*Enter the fcoo-namespace here*/) : window.fcoo; 
	//or var ns = window;

	var plugin_count = 1000;

	function JqueryBootstrapMmenu( $elem, options, plugin_count) {
		this.plugin_count = plugin_count;
		this.VERSION = "{VERSION}";
		this.options = $.extend({
			//Default options
		}, options || {} );


		//If JqueryBootstrapMmenu is a extention of class "ParentClass" include the next line 
		//window.ParentClass.call(this, input, options, plugin_count );

	
	}
  
  // expose access to the constructor
  ns.JqueryBootstrapMmenu = JqueryBootstrapMmenu;


	//jqueryBootstrapMmenu as jQuery prototype
	$.fn.jqueryBootstrapMmenu = function (options) {
		return this.each(function() {
			if (!$.data(this, "jqueryBootstrapMmenu"))
				$.data(this, "jqueryBootstrapMmenu", new window.JqueryBootstrapMmenu(this, options, plugin_count++));
		});
	};


	//Extend the prototype
	ns.JqueryBootstrapMmenu.prototype = {

		//myMethod
		myMethod: function( /*arg1, arg2*/ ){
		},
		


	};

	//If JqueryBootstrapMmenu is a extention of class "ParentClass" include the next line 
	//window.JqueryBootstrapMmenu.prototype = $.extend( {}, window.ParentClass.prototype, window.JqueryBootstrapMmenu.prototype );


	/******************************************
	Initialize/ready 
	*******************************************/
	$(function() { //"$( function() { ... });" is short for "$(document).ready( function(){...});"

	
	}); //End of initialize/ready
	//******************************************



}(jQuery, this, document));