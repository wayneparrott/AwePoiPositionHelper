ezar-poi
====================

This [Cordova](https://cordova.apache.org/) hybrid-mobile project demonstrates how to use the AwePoiPositionHelper to create [awe.js]((https://github.com/awe-media/awe.js) ) AR points of interest. 
You should be familiar with both the awe.js AR engine api and the Cordova SDK to build and customize
this project for your own use. 

*video of app goes here*


Getting Started
---------------
1. Clone this Github project. You need the Apache Cordova SDK installed with its commandline interface (CLI). 

2. Optional step: Download the ezAR VideoOverlay plugin if you want a live video visible on the background of your app. Use the Cordova commandline interface (CLI) to install the plugin. 

```
   cordova plugin install <path>/plugins/com.ezartech.ezar.videooverlay
```

3. Add the mobile platform(s) you wish to deploy the project on (ios,android)

```
   cordova platform install android
   cordova platform install ios
```

4. Build the project, install on your target platforms and test. Note: the config.xml file is configured such that the dependent Cordova plugins will be automatically downloaded and installed in the project.
```
   cordova build
```

Alternatively you can theoretically test the project using a Cordova mobile-web simulator such as Ripple. 






