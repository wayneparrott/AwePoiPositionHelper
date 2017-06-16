
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
        window.addEventListener('load', this.onLoad);
        window.addEventListener('pois_ready', this.createProjections);
        document.addEventListener('deviceready', this.onDeviceReady);
    },

    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function () {
        
        if (window.ezar) {
            ezar.initializeVideoOverlay(
                function () {
                    //ezar.getBackCamera().start();
                },
                function (err) {
                    alert('unable to init ezar: ' + err);
                });
        } else {
            alert('Video background is not available.');
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
                            ['libs/awe.js/js/plugins_/StereoEffect.js', 'libs/awe.js/js/plugins/VREffect.js'], // dependencies for render effects
                            'libs/awe.js/js/plugins_/awe.rendering_effects.js' + d,
                            'libs/awe.js/js/plugins_/awe-standard-object_clicked_or_focused.js' + d, // object click/tap handling plugin
                            'libs/awe.js/js/plugins_/awe.gyro.js', // basic gyro handling
                            'libs/awe.js/js/plugins_/awe.mouse.js' + d, // basic mouse handling
                            'js/ecef.js',
                            'js/AwePoiPositionHelper.js'
                        ],
                        success: function (y) {
                    
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
                            
                                // {poi_id: 'north_pt', gps: {lat:33.073983, lng:-96.7565192, height: 0} },
                                // {poi_id: 'south_pt', gps: {lat:33.073275, lng:-96.756939,  height: 0}},
                                // {poi_id: 'east_pt',  gps: {lat:33.073414, lng:-96.756151,  height: 0}},
                                // {poi_id: 'west_pt',  gps: {lat:33.073610, lng:-96.756926,  height: 0}}, 

                                //polar coordinates
                                {poi_id: 'north_pt', polar: {angle: 0,  radius: 50, height: 20}},
                                {poi_id: 'east_pt',  polar: {angle: 90, radius: 30, height: 10}},
                                {poi_id: 'south_pt', polar: {angle: 180,radius: 20, height: 5}},
                                {poi_id: 'west_pt',  polar: {angle: 270,radius: 10, height: 0}}
                            ];

                            AwePoiPositionHelper.initialize(
                                poiLocations,
                                {   povHeight: 10, 
                                    showGrid: true
                                });
                            
                            //Create awe POIs and start tracking device position changes.
                            //Awe Projections are created in createProjections(). This function
                            //is the callback for the custom "pois_ready" event.
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

    //create Awe projections (cubes). Note that the projection poi_id property is the key to the
    //poi's defined above. Also the projections are created visibility=false. AwePoiPositionHelper 
    //changes the visibility to true of all projections associated with a poi it manages to visible.
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



 