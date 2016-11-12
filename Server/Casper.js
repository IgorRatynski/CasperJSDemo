"use strict";

var BR = global.BR = {};

BR.Config = require('Config/Config');

BR.Casper = require('casper').create({
    //verbose: true,
    //logLevel: 'debug'
});

BR.Casper.options.viewportSize = {width: 1920, height: 1080};

var _ = global._ = require('underscore');

require('/Classes/Service');
require('/Classes/Broadcast');

require('/Services/Grabber');

BR.Grabber.startGrabbing();