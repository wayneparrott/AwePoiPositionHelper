# hello-poi
A simple ezAR&trade; hello world app based on the default Cordova project template.  
See index.html for the small set of changes required to enable ezAR in your application.  
![logo](screenshot.png)  


##Getting Started
While ezAR works with Cordova-based SDKs such as Ionic, only Cordova CLI examples are provided below. 
This example was built and tested with Cordova 6.0 and only uses the VideoOverlay plugin.

Step-1.  Add the ezAR Cordova plugins to the project

     cordova plugin add <pathToEzAR>/plugins/com.ezartech.ezar.videooverlay
     
Step-2.  Add your target platform(s) to the project

     cordova platform add ios
    
or

     cordova platform add android


Step-3.  Build and install on device
Note: because of the ezAR camera requirement the app will only perform correctly when installed on a real mobile device.


##ezAR Docs and Tech Support
See [ezartech.com](http://ezartech.com) for documentation and support.


Copyright (c) 2015-2016, ezAR Technologies
