/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
var app = {

    // Application Constructor
    initialize: function () {
        //window.ezarPoiEngine = app.ezarPoiEngine;

        this.bindEvents();
    },

    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function () {
        window.addEventListener('load', this.onLoad, false);
        window.addEventListener('pois_ready', this.createProjections, false);
        document.addEventListener('deviceready', this.onDeviceReady, false);
    },

    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function () {
        
        if (window.ezar) {
            ezar.initializeVideoOverlay(
                function () {
                    ezar.getBackCamera().start();
                },
                function (err) {
                    alert('unable to init ezar: ' + err);
                });
        } else {
            alert('Unable to detect the ezAR plugin');
        }
    },

    onLoad: function () {
        // initialize awe
        window.awe.init({
            // automatically detect the device type
            device_type: awe.AUTO_DETECT_DEVICE_TYPE,
            // populate some default settings
            settings: {
                container_id: 'pois',
                fps: 30,
                default_camera_position: {
                    x: 0,
                    y: 0,
                    z: 0
                },
                default_lights: [{
                    id: 'hemisphere_light',
                    type: 'hemisphere',
                    color: 0xCCCCCC
                }, ],
            },
            ready: function (x) {
                
                var d = '?_=' + Date.now();

                // load js files based on capability detection then setup the scene if successful
                awe.util.require([
                    {
                        capabilities: ['webgl'],
                        files: [
                            ['libs/awe.js/js/awe-standard-dependencies.js' + d, 'libs/awe.js/js/awe-standard.js'], // core dependencies for this app 
                            ['libs/awe.js/js/plugins/StereoEffect.js', 'libs/awe.js/js/plugins/VREffect.js'], // dependencies for render effects
                            'libs/awe.js/js/plugins/awe.rendering_effects.js' + d,
                            'libs/awe.js/js/plugins/awe-standard-object_clicked_or_focused.js' + d, // object click/tap handling plugin
                            'libs/awe.js/js/plugins/awe.gyro.js', // basic gyro handling
                            'libs/awe.js/js/plugins/awe.mouse.js' + d, // basic mouse handling
                            'js/ecef.js',
                            'js/awePoiPositionHelper.js'
                        ],
                        success: function (y) {
                            console.log("ready " + x);

                            // setup and paint the scene
                            awe.setup_scene();

                            var click_plugin = awe.plugins.view('object_clicked');
                            if (click_plugin) {
                                click_plugin.register();
                                click_plugin.enable();
                            }

                            var gyro_plugin = awe.plugins.view('gyro');
                            if (gyro_plugin) {
                                gyro_plugin.enable();
                            }

                            var mouse_plugin = awe.plugins.view('mouse');
                            if (mouse_plugin) {
                                mouse_plugin.enable();
                            }

                            var render_effects_plugin = awe.plugins.view('render_effects');
                            if (render_effects_plugin) {
                                render_effects_plugin.enable();
                            }

                            // setup some code to handle when an object is clicked/tapped
                            window.addEventListener('object_clicked', function (e) {
                                var p = awe.projections.view(e.detail.projection_id);
                                awe.projections.update({ // rotate clicked object by 180 degrees around x and y axes over 10 seconds
                                    data: {
                                        animation: {
                                            duration: 10,
                                        },
                                        rotation: {
                                            y: p.rotation.y + 180,
                                            x: p.rotation.x + 180
                                        }
                                    },
                                    where: {
                                        id: e.detail.projection_id
                                    }
                                });
                            }, false);

                            var poiLocations = [
                                //{poi: 'pt1', lat:33.073549, lng:-96.756649}, //home
                                // {poi: 'north_pt', lat:33.073983, lng:-96.7565192},
                                // {poi: 'south_pt', lat:33.073275, lng:-96.7565192},
                                // {poi: 'east_pt',  lat:33.073735, lng:-96.7560},
                                // {poi: 'west_pt',  lat:33.073735, lng:-96.7569}        

                                // {poi_id: 'north_pt', gps: {lat:33.073983, lng:-96.7565192} },
                                // {poi_id: 'south_pt', gps: {lat:33.073275, lng:-96.756939}},
                                // {poi_id: 'east_pt',  gps: {lat:33.073414, lng:-96.756151}},
                                // {poi_id: 'west_pt',  gps: {lat:33.073610, lng:-96.756926}}, 

                                //polar coordinates
                                {poi_id: 'north_pt', polar: {angle: 0,  radius: 50, elev: 10}},
                                // {poi_id: 'south_pt', polar: {angle: 180,radius: 20, elev: 0}},
                                // {poi_id: 'east_pt',  polar: {angle: 90, radius: 20, elev: 0}},
                                // {poi_id: 'west_pt',  polar: {angle: 270,radius: 20, elev: 0}}
                            ];

                            AwePoiPositionHelper.initialize(
                                poiLocations,
                                {povHeight: 10, showGrid: true, linkAweRefFrameToCompassHeading:false});
                            
                            AwePoiPositionHelper.start();
                        
                        }
                    },
                    { // else create a fallback
                        capabilities: [],
                        files: [],
                        success: function () {
                            document.body.innerHTML = '<p>This demo currently requires a standards compliant mobile browser.';
                            return;
                        }
                    },
                ]);
            }
        })
    },

    createProjections: function() {
                           
        awe.projections.add({                            
                id: 'north_poi',
                visible: false,
                geometry: {
                    shape: 'cube',
                    x: 5,
                    y: 5,
                    z: 5
                },
                rotation: {
                    x: 30,
                    y: 30,
                    z: 0
                },
                material: {
                    type: 'basic',
                    color: 0x0000ff, //blue
                    wireframe: false
                },
            }, {
                poi_id: 'north_pt'
            }
        );
        awe.projections.add({                            
                id: 'south_poi',
                visible: false,
                geometry: {
                    shape: 'cube',
                    x: 5,
                    y: 5,
                    z: 5
                },
                rotation: {
                    x: 30,
                    y: 30,
                    z: 0
                },
                material: {
                    type: 'basic',
                    color: 0xff0000, //red
                    wireframe: false
                }
            }, {
                poi_id: 'south_pt'
            }
        );
        awe.projections.add({                            
                id: 'east_poi',
                visible: false,
                geometry: {
                    shape: 'cube',
                    x: 5,
                    y: 5,
                    z: 5
                },
                rotation: {
                    x: 30,
                    y: 30,
                    z: 0
                },
                material: {
                    type: 'basic',
                    color: 0x00ff00, //green
                    wireframe: false
                }
            }, {
                poi_id: 'east_pt'
            }
        );
        awe.projections.add({                            
                id: 'west_poi',
                visible: false,
                geometry: {
                    shape: 'cube',
                    x: 5,
                    y: 5,
                    z: 5
                },
                rotation: {
                    x: 30,
                    y: 30,
                    z: 0
                },
                material: {
                    type: 'basic',
                    color: 0xff8010, //orange
                    wireframe: false
                }
            }, {
                poi_id: 'west_pt'
            }
        );

    }
    
};

app.initialize();

window.app = app;



 