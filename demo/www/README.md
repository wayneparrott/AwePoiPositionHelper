ezar-poi
====================

This [Cordova](https://cordova.apache.org/) hybrid-mobile project demonstrates how to use the AwePoiPositionHelper to create [awe.js]((https://github.com/awe-media/awe.js) ) AR points of interest. 
You should be familiar with both the awe.js AR engine api and the Cordova SDK to build and customize
this project for your own use. 

*video of app goes here*


Getting Started
---------------
1. Clone this Github project

2. From the <prj>/demo directory use the Cordova commandline interface (CLI) to dynamically install the preconfigured Cordova plugins

```
   cordova plugins ls
```

3. Optional step: Download and install the ezAR VideoOverlay plugin if you want a live video visible on the background of your app

```
   cordova plugin install <path>/plugins/com.ezartech.ezar.videooverlay
```

4. Add the mobile platform(s) you wish to deploy the project on (ios,android)

```
   cordova platform install android
   cordova platform install ios
```

4. Build the project, install on your target platforms and test
```
   cordova build
```

or theoretically you can test the project using a Cordova mobile-web simulator such as Ripple. 






