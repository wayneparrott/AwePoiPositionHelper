AwePoiPositionHelper
====================

Position [awe.js](https://github.com/awe-media/awe.js) points of interest (poi) in your [Cordova](https://cordova.apache.org/) hybrid-mobile app using gps (lat,lng) coordinates or polar coordinates. 
As you move and change the device's position the awe.js point of view (pov) position is updated respectively. By default POI's are positioned relative to the north compass heading (0 degress) as provided by the device compass heading. Options are available for configure linking the awe.js AR reference frame to the device 
position and compass heading.

In addition to defining the POIs in your app you are responsible for defining the awe projections of your projectUse the POI.id 

The following Cordova plugins are required:  
  [cordova-plugin-device](https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-device/index.html)  
  [cordova-plugin-device-orientation](https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-device-orientation/index.html)  
  [cordova-plugin-geolocation](https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-geolocation/index.html)   
  [com.ezartech.ezar.videooverlay](https://www.ezartech.com/docsvideooverlay) - *optional*

Defining a Point of Interest
----------------------------

AwePoiPositionHelper supports 2 formats for defining a POI: 
* GPS latitude & longitude coordinate
* Polar coordinates relative to the position of the device when start() is called.

**GPS (Lat,Lng) Format**  

```
{ poi_id: <string>,     //unique identifier  
    gps: {  
      lat: <number>,    //latitude  
      lng: <number>,    //longitude  
      height: <number>  //height above the ground, default=0   
    }  
}
```

**Polar Coordinate Format**  
```
{ poi_id: <string>,  //unique identifier
  polar: {
    radius: number, //height above the ground 
    angle: number,  //compass heading in degrees
    height?=0,      //height above the ground
  } 
}
```

Note on GPS coordinates and POI positioning
-------------------------------------------
POI positions defined with GPS (latitude,longitude) coordinates are converted to ECEF XYZ coordinates measured in meters. A relative XYZ position (meters) is created by subtracting the POI(xyz) from the ECEF of device's current gps position. A default 1m:1unit scale is used when mapping XYZ coordinates to awe/three.js object positions. Keep in mind that awe.js projections positioned outside of the view frustum (default 2000) will not be visible. Thus POIs with positioned defined with gps coordinates > 2000m from the device's current position will not be visible. To address this you can increase the awe POV far property to a much larger number. 

*Todo: add scaling support*

# API

initialize( poiLocations: POI[], options?: Object )
-------------------------------------------------

  Configure the Helper with the POI definitions and options. This function detects the Cordova
  **deviceready** event.
```javascript
initialize( 
  poiLocations  //array of 0 or more point of interest definitions  
  [,options { 
    linkAweRefFrameToCompassHeading: true //align awe ref frame with compass due north (deg 0)
    linkAwePovToDevicePosition: true, // update POV location as device position changes
    povHeight: 0,                     // height of POV (camera) above ground plane, default=0 
    showGrid: false,                  // show wireframe grid on ground plane, default=false
    gridSize: 500,                    // size of square grid, default=500
    gridDivisions: 10,                // number of grid divisions, default=10
    gridColor: 0xff8010               // hex color, default=orange
  }])
```

start()
--------
      
  Create and position POI objects. POIs positioned by gps (lat,lng) coordinates are converted to [Earth-Centered,Earth-Fixed](https://en.wikipedia.org/wiki/ECEF) coordinates. POI's positioned using polar coordinates are positioned relative to current location. When options.linkCameraToPosition is true (default)update the awe.pov as the device position changes. The Cordova device, deviceorientation (compass) and geolocation plugins are required for this function to perform correctly. 

  This function requires the Cordova deviceready event to complete operation. Prior to return of this function a custom "pois_ready" event is dispatched. Consider using this event to trigger and updates to awe projections attached to POIs such as setting visibility or other properties.


stop()
------

Stop position tracking and the Cordova plugin watchHeading and watchPosition tasks. Reset the state such that start() can be called.

# Events

*poi_ready*
Signals that AwePoiPositionHelper has completed creating and updating the initial positions of all points of interest relative to the device's gps location and heading

```
window.addEventListener('pois_ready', function() {
  awe.projections.add(
    {                            
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
      poi_id: 'north_pt' //the id of a POI
    }
  }), false);
```




