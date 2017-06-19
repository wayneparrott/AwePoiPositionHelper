/*
 * AwePoiPositionHelper.js
 *
 * Copyright 2017, ezAR Technologies
 * http://ezartech.com
 *
 * Author: @wayne_parrott, @ezartech
 *
 * Licensed under a modified MIT license. 
 * Please see LICENSE file or [online version](http://ezartech.com/ezarstartupkit-license) for more information.
 *
 */

//Position points of interest using gps and polar coordinates and track
// as device position changes.
// Dependencies:
//   ecef.js   - converts gps (lat,lng) to xyz coords
//   cordova plugins: 
//      device - required for determing platform details, e.g., iOS or Android
//      geolocation (lat,lng) - required to deterine the device position and changes in position
//      device-orientation (compass heading) - required to determine the device compass heading
//
// Custom events: 
//   pois_ready - indicates awe POIs created and positioned 
//   heading_changed - indicates device compass heading changed, event.detail is current heading value (number)
//   position_changed - indicates device position changed, event.detail is current {lat,lng}
//
//todo: 
//  1) add events location_changed, state_changed
//  2) no requirement for device-orientation plugin when option.linkAweRefFrameToCompassHeading
//      watchHeading() changes are not needed
//  3) no requirement for gps plugin when option.linkAwePovToDevicePosition == false and no gps POIs
//     watchPosition() changes not needed 
//  4) replace device.platform implementation in order to remove requirement for Cordova device plugin
//
var AwePoiPositionHelper = (function () {  

    var States = {
            STOPPED: 'STOPPED',
            STARTING: 'STARTING',
            RUNNING: 'RUNNING',
            STOPPING: 'STOPPING' //not used
    };
    var _state = States.STOPPED;

    var _options = {}; // see DEFAULT_OPTIONS
    var _headingWatchId;
    var _heading;
    var _headingSampleCnt = 0;

    var _geolocWatchId;
    var _geolocData = {
            initialGeoloc: null,    //{lat, lng}
            geoloc: null,           //{lat, lng}
            prevEcefLoc: null,      //{x,y,z}
            ecefLoc: null,          //{x,y,z}
            data: [],  //data pts for moving avg
            maxSampleCnt: 5,
            avgSum: {lat:0,lng:0}
    };

    var _cordovaPluginsReady; //set true on deviceready event
    var _arePoisReady;

    //
    var DEFAULT_OPTIONS = {
    
        //align awe reference frame to compass, i.e. -z points due north (deg 0)
        linkAweRefFrameToCompassHeading: true,

        //move pov position (camera) as the gps position of the device changes
        linkAwePovToDevicePosition: true,

        //distance above or below ground plane
        povHeight: 0,
        
        //filter all headings s.t. headingInfo.headingAccuracy > minHeadingAccuracy
        minHeadingAccuracy: 15,
        
        
        //Show xyz axis lines.
        // povHeight must be < 0 or > 0 for the axis to be visible 
        // Uses a THREE.AxisHelper.
        showAxis: false,
        axisLength: 500,

        //Show a grid on the ground plane. 
        // povHeight must be < 0 or > 0 in order to view axis.
        // Uses a THREE.GridHelper.
        showGrid: false,
        gridSize: 500,
        gridDivisions: 10,
        gridColor: 0xff8010 //orange
    }

    //Cordova device_orientation plugin watchHeading options
    var _headingOptions = {
        frequency: 100 //default 100
    };


    //Cordova geolocation plugin watchPosition options
    var _geolocationOptions = {
        enableHighAccuracy: true
    };


    var initialize = function(poiLocationsArray, options) {
        document.addEventListener('deviceready', AwePoiPositionHelper._deviceReady);

        poiLocations = poiLocationsArray;

        options = options || {};
        options.linkAweRefFrameToCompassHeading = options.hasOwnProperty('linkAweRefFrameToCompassHeading') ? 
            options.linkAweRefFrameToCompassHeading : DEFAULT_OPTIONS.linkAweRefFrameToCompassHeading;
        options.linkAwePovToDevicePosition = options.hasOwnProperty('linkAwePovToDevicePosition') ? 
            options.linkAwePovToDevicePosition : DEFAULT_OPTIONS.linkAwePovToDevicePosition;
        options.minHeadingAccuracy = options.hasOwnProperty('minHeadingAccuracy') ? options.minHeadingAccuracy : DEFAULT_OPTIONS.minHeadingAccuracy;
        options.povHeight = options.hasOwnProperty('povHeight') ? options.povHeight : DEFAULT_OPTIONS.povHeight;
        options.showAxis = options.hasOwnProperty('showAxis') ? options.showAxis : DEFAULT_OPTIONS.showAxis;   
        options.axisLength = options.hasOwnProperty('axisLength') ? options.axisLength : DEFAULT_OPTIONS.axisLength;   
        options.showGrid = options.hasOwnProperty('showGrid') ? options.showGrid : DEFAULT_OPTIONS.showGrid;   
        options.gridSize = options.hasOwnProperty('gridSize') ? options.gridSize : DEFAULT_OPTIONS.gridSize;   
        options.gridDivisions = options.hasOwnProperty('gridDivisions') ? options.gridDivisions : DEFAULT_OPTIONS.gridDivisions;   
        options.gridColor = options.hasOwnProperty('gridColor') ? options.gridColor : DEFAULT_OPTIONS.gridColor;
        _options = options;   
    }


    var start = function() {
        //todo add timeout to avoid endless loop when there is error with cordova plugins
        //console.log('state',_state);

        switch(_state) {
            case States.STOPPED:
                _state = States.STARTING;
                _startHeadingWatch();
                _startGeolocationWatch();            
            case States.STARTING:
                //wait for initial heading & geolocation data to arrive
                setTimeout( function() {
                    if (AwePoiPositionHelper._requiredStartDataReceived()) {
                        AwePoiPositionHelper._continueStart();
                    } else {
                        AwePoiPositionHelper.start();
                    }
                }, 200);
                break;
            default:
                //do nothing
        }    
    }


    var _continueStart = function() {

        //adjust POIs position; create poi if it does not exist
        _processPoiLocations(!!_options.linkAweRefFrameToCompassHeading);
        
        //rotate camera to compensate for initial heading of device
        if (!!_options.linkAweRefFrameToCompassHeading) {
            _applyInitialHeadingOffset();
        }

        //notify listeners that POIs are ready for use
        _arePoisReady = true;
        var event = new CustomEvent('pois_ready');
        window.dispatchEvent(event);

        _makeProjectionsVisible();
        _state = States.RUNNING;

        //
        if (!isNaN(_options.povHeight)) {
            _getThreeCamera().position.y = _options.povHeight;
        }
        
        var threeScene = _getThreeScene();
        if (!!_options.showAxis) {
            var axisHelper = new THREE.AxisHelper(_options.axisLength);
            threeScene.add(axisHelper);
        }

        if (!!_options.showGrid) {
            var gridHelper = new THREE.GridHelper(_options.gridSize, _options.gridDivisions); 
            gridHelper.setColors(_options.gridColor,_options.gridColor);
            threeScene.add(gridHelper);
        }
    }


    var stop = function() {
        _stopGeolocationWatch();
        _stopHeadingWatch();
        
        _state = States.STOPPED;

        //all state for new start() session
        _reset();
    }


    //reset internal state
    var _reset = function() {
        
        _headingWatchId = null;
        _heading = null;
        _headingSampleCnt = 0;

        _geolocWatchId = null;
        _geolocData = {
            initialGeoloc: null,
            geoloc: null,
            prevEcefLoc: null,
            ecefLoc: null,
            data: [],  //data pts for moving avg calc
            maxSampleCnt: 5,
            avgSum: {lat:0,lng:0}
        };

        _arePoisReady = false;
    }


    var _deviceReady = function() {
        //console.log('device ready');
        _cordovaPluginsReady=true;
    }


    var _requiredStartDataReceived = function() {
        return( 
            _cordovaPluginsReady &&
            _state == States.STARTING && 
            _hasHeading() && 
            _hasGeolocation());
    }


    var _getThreeScene = function() {
        return awe.scene().get_three_scene();
    }


    var _getThreeCamera = function() {
        var camera;
        var objs = _getThreeScene().children;
        for (i=0; i < objs.length; i++) {
            var obj = objs[i];
            if (obj.type.indexOf('Camera') > -1) {
                camera = obj;
                break; 
            }
        }

        return camera;
    }


    var _startHeadingWatch = function() {
    
        _headingWatchId = navigator.compass.watchHeading(
            function(headingInfo) {        
                AwePoiPositionHelper._updateHeading(headingInfo);                    
            },
            _errorHandler,
            _headingOptions
        );
    }


    var _stopHeadingWatch = function() {
        if (_headingWatchId) {
            navigator.compass.clearWatch(_headingWatchId);
        }

        AwePoiPositionHelper._headingWatchId = null;
    }


    var _hasHeading = function() {
        return ! isNaN(_getHeading()) ;
    }


    var _getHeading = function() {
        return _heading;
    }


    var _updateHeading = function(headingInfo) {
        
        //track number of heading callbacks, 
        // Discovered during testing to ignore the initially heading events.
        // On android the first few data pts are 0. On iOS the initial accuracy is way off.
        _headingSampleCnt++;
        if (_headingSampleCnt < 10) return;
        
        if (headingInfo.headingAccuracy > _options.minHeadingAccuracy || 
             headingInfo.trueHeading < 0) return;

         //console.log('true:',headingInfo.trueHeading,'magnetic:',headingInfo.magneticHeading);
        _heading = !!headingInfo.trueHeading ? headingInfo.trueHeading : headingInfo.magneticHeading;  

        var event = new CustomEvent('headingChanged',{detail: _heading});
        window.dispatchEvent(event);

        //console.log('heading: ' + _heading);
    }


    var _hasGeolocation = function() {
        return _getGeolocation() != null;
    }


    var _getGeolocation = function() {
        return _geolocData.geoloc;
    }


    var _startGeolocationWatch = function() {
        _geolocWatchId = 
            navigator.geolocation.watchPosition(
                function(position) {
                    AwePoiPositionHelper._updateGeolocation(position);                 
                },
                _errorHandler, 
                _geolocationOptions);
    }


    var _stopGeolocationWatch = function() {
        if (AwePoiPositionHelper._geolocWatchId) {
            navigator.geolocation.clearWatch(_geolocWatchId);
        }

        AwePoiPositionHelper._geolocWatchId = null;
    }


    var _updateGeolocation = function(position) {

        var rawGeoloc = {lat:position.coords.latitude,lng:position.coords.longitude};
        
        _geolocData.data.push(rawGeoloc);

        if (_geolocData.data.length > 1) {
            //rm 1st oldest ecef, add newest to end
            var oldGeoLocData = _geolocData.data.shift();
            _geolocData.avgSum.lat += rawGeoloc.lat - oldGeoLocData.lat;
            _geolocData.avgSum.lng += rawGeoloc.lng - oldGeoLocData.lng;            
        } else {
            //populate using 1st reading
            for (i=1; i <  _geolocData.maxSampleCnt; i++) {
                _geolocData.data.push(rawGeoloc);
            }
            _geolocData.avgSum.lat = rawGeoloc.lat * _geolocData.maxSampleCnt;
            _geolocData.avgSum.lng = rawGeoloc.lng * _geolocData.maxSampleCnt;
        }

        _geolocData.geoloc = {
            lat: _geolocData.avgSum.lat / _geolocData.maxSampleCnt,
            lng: _geolocData.avgSum.lng / _geolocData.maxSampleCnt
        };

        _geolocData.prevEcefLoc = _geolocData.ecefLoc;
        _geolocData.ecefLoc = 
                project(_geolocData.geoloc.lat,_geolocData.geoloc.lng,0);

        // console.log('lat: ' + position.coords.latitude);
        // console.log('long: ' + position.coords.longitude);

        if (!_geolocData.initialGeoloc) {
            _geolocData.initialGeoloc = _geolocData.geoloc;
            _geolocData.prevEcefLoc = _geolocData.ecefLoc;
        }

        _updateCamera();

        var event = new CustomEvent('positionChanged',{detail: _geolocData.geoloc});
        window.dispatchEvent(event);
    }


    var _processPoiLocations = function(linkAweRefFrameToCompassHeading) {

        if (!poiLocations) return;

        //for each poi 
        for (i=0; i < poiLocations.length; i++) {
            var poiLoc = poiLocations[i];
            if (poiLoc.gps) 
                _processPoiGeolocation(poiLoc);
            else 
                _processPoiPolarLocation(poiLoc,linkAweRefFrameToCompassHeading);
        }
    }

    var _processPoiGeolocation = function(poiGeoLoc) {
        //test origin
        //heading = 1.0;
        // ecefLoc = project(33.074,-96.7565192,0);
        // console.log('heading',heading,ecefLoc[0],ecefLoc[1]);

        //Compute global ecef for poi
        var poiEcefLoc = project(poiGeoLoc.gps.lat, poiGeoLoc.gps.lng, 0);

        //Convert global ecef to local xyz position relative to origin position
        poiEcefLoc[0] -= _geolocData.ecefLoc[0];
        poiEcefLoc[1] -= _geolocData.ecefLoc[1];
        poiEcefLoc[2] -= _geolocData.ecefLoc[2];
            
        //todo: add scale global ecef down to local ec
        // 1m:Xunits

        //Look up POI in order to update its position.
        //If not found create a new POI.
        var poi = awe.pois.view(poiGeoLoc.poi_id);
        if (!poi) {
                awe.pois.add({
                id: poiGeoLoc.poi_id,
                position: {  
                    x: 0,
                    y: 0,
                    z: 0
                }
            });
            poi = awe.pois.view(poiGeoLoc.poi_id);
        }

        poi.update({position:
            {x: poiEcefLoc[0],
             y: poiGeoLoc.gps.height,
             z: poiEcefLoc[1]*-1 //translate z to -z
            }
        });

        if (device.platform == 'iOS') {
            //rotate 90
            var vec = new THREE.Vector2(poi.position.x,poi.position.z);
            var rot = THREE.Math.degToRad(90); 
            vec.rotateAround({x:0,y:0}, rot);
            poi.update({position: {x:vec.x,z:vec.y}});

        }

        return poi;
    }


    var _processPoiPolarLocation = function(poiPolarLoc,linkAweRefFrameToCompassHeading) {
      
        //Create a vec2 with radius down the x-axis
        var vec2 = new THREE.Vector2(poiPolarLoc.polar.radius,0);

        //rotate the vec2 by the polar angle and adjust for north being on z-axis in -z direction
        vec2.rotateAround({x:0,y:0}, THREE.Math.degToRad(poiPolarLoc.polar.angle));

        if (device.platform == 'Android') {
            var angle = -90;
            vec2.rotateAround({x:0,y:0}, THREE.Math.degToRad(angle));
        }

        //todo: scale 

        //Look up POI in order to update its position,
        //If not found, create a new POI 
        var poi = awe.pois.view(poiPolarLoc.poi_id);
        if (!poi) {             
                awe.pois.add({
                id: poiPolarLoc.poi_id,
                position: {  
                    x: 0,
                    y: 0,
                    z: 0
                }
            });
            poi = awe.pois.view(poiPolarLoc.poi_id);
        }
        
        poi.update({position:
            {x: vec2.x,
             y: poiPolarLoc.polar.height,
             z: vec2.y
            }
        });

        return poi;
    }


    var _applyInitialHeadingOffset = function() {
       var h = _getHeading();
       //console.log('heading: ', h);

        //for each poi rotationally translate position by initial heading
        var pois = awe.pois.list();
        for (i=0; i < pois.length; i++) {
            var poi = pois[i];
            
            //compute rotational translation angle
            let vec = new THREE.Vector2(poi.position.x,poi.position.z);
            let rot = THREE.Math.degToRad(-h); 

            //apply rotational translation and update position
            vec.rotateAround({x:0,y:0}, rot);
            poi.update({position: {x:vec.x,z:vec.y}});

            //console.log('dist: ', vec.length(), vec.x, vec.y);
        }
    }


    var _makeProjectionsVisible = function() {
         //now make all projections with a poi visible

        if (!poiLocations) return;

        var projections = window.awe.projections.list();
        for (i=0; i < poiLocations.length; i++) {
            var poiId = poiLocations[i].poi_id;
        
            for (j=0; j < projections.length; j++) {
                var projection = projections[j];
                if (projection.get_position_mesh().parent.poi_id == poiId) {
                    projection.update({visible:true});
                    continue;
                }
            }
        }
    }


    var _updateCamera = function() {
        if (! (_arePoisReady && _options.linkAwePovToDevicePosition)) return;

        var MIN_ECF_DELTA = 1.0;
        var prevEcef = _geolocData.prevEcefLoc;
        var curEcef = _geolocData.ecefLoc;

        var x = Math.round(curEcef[0] - prevEcef[0]);
        var z = Math.round(curEcef[1] - prevEcef[1]);

        //limit camera updates to significant position changes
        if (Math.abs(x) >= MIN_ECF_DELTA || Math.abs(z) >= MIN_ECF_DELTA) {
            var camera = awe.scene().get_three_scene().children[0];
            camera.position.x += x; 
            camera.position.z += -z; //compensate for -z to north direction 
            
            //todo: animate change rather than abrupt discrete change

            //console.log('camera', x, z, camera.position);            
        }
    }


    var _errorHandler = function(msg) {
        console.error(msg);
    }


    return {
        initialize: initialize,
        start: start,
        stop: stop,

        _deviceReady: _deviceReady,
        _requiredStartDataReceived: _requiredStartDataReceived,
        _continueStart: _continueStart,
        _updateHeading: _updateHeading,        
        _updateGeolocation: _updateGeolocation

    }

})();

