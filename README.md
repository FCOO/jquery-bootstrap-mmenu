# jquery-bootstrap-mmenu



## Description

[jquery-bootstrap](https://github.com/FCOO/jquery-bootstrap) version of menus from [Mmenu](https://mmenujs.com/)

## Installation
### bower
`bower install https://github.com/FCOO/jquery-bootstrap-mmenu.git --save`

## Demo
http://FCOO.github.io/jquery-bootstrap-mmenu/demo/

## Usage

See description and documentation in the two source-files


## Example

    <div id="menu" style="width:300px; margin-left:30px"></div>
    <script>
        var menu = {
                inclBar    : true,
                barCloseAll: true,
                favorites: {
                    get   : function(id){ return false; }, 
                    add   : function(id){ return true; }, 
                    remove: function(id){ return true; }, 
                },
                onChange: function(id, state, item){
                    console.log('GLOBAL onChange', id, state, item);
                },
                list: [{
                    icon: 'fa fa-map',
                    text: {da:'Første menupunkt', en:'First Menu Item'},
                    addToBar: true,
                    list: [{
                        text: {da:'Første underpunkt', en:'First Sub Item'}
                    }, {
                        type: "text", text: {da:'Menupunkt der er meget lang med en masse tekst der gerne skal  vises over flere linier', en:'A very loooooooooooooooooooooooooooooooooooooong item'},
                    }]
                }, {
                    text: {da:'Overflade', en:'Surface'},
                    list: [{
                        id:'SEALVL', text: {da: 'Vandstand', en:'Sea Level'},
                        list: [
                            {
                                id: 'sealvl1',
                                type:'radio', 
                                content: [
                                    {text: {da: 'Indre Danske Farvande', en:'Inner Danish Waters'}},
                                    $('<img height="30px" src="https://wms01.fcoo.dk/webmap/v2/data/DMI/HARMONIE/DMI_NEA_MAPS_v005C.nc.wms?request=GetColorbar&styles=horizontal%2Cnolabel&cmap=Wind_ms_BGYRP_11colors"/>')
                                ]
                            }, {
                                id: 'sealvl2',
                                type:'radio', 
                                content: [
                                    {text: {da: 'Navigation', en:'Navigation'}},
                                    $('<img height="30px" src="https://wms01.fcoo.dk/webmap/v2/data/DMI/HARMONIE/DMI_NEA_MAPS_v005C.nc.wms?request=GetColorbar&styles=horizontal%2Cnolabel&cmap=Wind_ms_BGYRP_11colors"/>')
                                ]
                            }, {
                                id: 'sealvl3',
                                type:'radio', 
                                content: [
                                    {text: {da: 'Noget andet', en:'Something else'}},
                                    $('<img height="30px" src="https://wms01.fcoo.dk/webmap/v2/data/DMI/HARMONIE/DMI_NEA_MAPS_v005C.nc.wms?request=GetColorbar&styles=horizontal%2Cnolabel&cmap=Wind_ms_BGYRP_11colors"/>')
                                ],
                        }]
                    }]
                }]
            };
            
            var myBsMenu = $.bsMmenu(menu, {offCanvas: false}).create($('#menu'));
    </script>

## Copyright and License
This plugin is licensed under the [MIT license](https://github.com/FCOO/jquery-bootstrap-mmenu/LICENSE).

Copyright (c) 2021 [FCOO](https://github.com/FCOO)

## Contact information

Niels Holt nho@fcoo.dk


## Credits and acknowledgements
[mmenu](https://mmenujs.com/) by [Fred Heusschen](https://github.com/FrDH)