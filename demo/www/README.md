AwePoiPositionHelper
====================

Position [awe.js](https://github.com/awe-media/awe.js) points of interest (poi) in your [Cordova](https://cordova.apache.org/) hybrid-mobile app using gps (lat,lng) coordinates or polar coordinates. As the device position changes, update the awe.js point of view (pov) position respectively. All POI's are positioned relative to the north compass heading (0 degress) as provided by the device compass heading.

The following Cordova plugins are required:  
  [cordova-plugin-device](https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-device/index.html)  
  [cordova-plugin-device-orientation](https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-device-orientation/index.html)  
  [cordova-plugin-geolocation](https://cordova.apache.org/docs/en/latest/reference/cordova-plugin-geolocation/index.html)   

Defining a Point of Interest
----------------------------

There are 2 formats for defining a POI: 
* GPS latitude & longitude coordinate
* Polar coordinates relative to the position of the device when start() is called.

**GPS (Lat,LNG) Format**  

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

# API

initialize( poiLocations: POI[], options?: Object )
-------------------------------------------------

  Configure the Helper with the POI definitions and options.  
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
      
  Create and position POI objects. POIs positioned by gps (lat,lng) coordinates are converted to [Earth-Centered,Earth-Fixed](https://en.wikipedia.org/wiki/ECEF) coordinates. POI's positioned using polar coordinates are positioned relative to current location. When options.linkCameraToPosition is true (default) update the awe.pov as the device position changes. The Cordova device, deviceorientation (compass) and geolocation plugins are required for this function to perform correctly. 

  Prior to return of this function a the custom "pois_ready" event is dispatched. Consider using this event to trigger and updates to awe projections attached to POIs such as setting visibility or other properties.


stop()
------

Stop position tracking and the Cordova plugin watchHeading and watchPosition tasks. Reset the state such that start() can be called.

# Events

*poi_ready*
Signals that AwePoiPositionHelper has completed creating and updating the initial positions of all points of interest relative to the device's gps location and heading

```
window.addEventListener('pois_ready, function() {
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



