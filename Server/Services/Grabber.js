BR.Grabber = new Service({

    Name: 'Grabber',

    initialize: function() {

        this.Query = [];

        this.Data  = [];

    },

    run: function() {

        this.runCasperjsProcess();

        setInterval(function() {

            BR.Grabber.runCasperjsProcess();

        }, 60000);

    },

    runCasperjsProcess: function() {

        var spawn = require('child_process').spawn;
        var prc = spawn('casperjs',  ['Casper.js']);

        prc.stdout.setEncoding('utf8');
        prc.stdout.on('data', function (data) {
            var str = data.toString()
            var lines = str.split(/(\r?\n)/g);
            console.log(lines.join(""));
        });

        prc.on('close', function (code) {

            console.log('Casperjs process exit code ' + code);

            BR.Rates.updateTopRatesCache();

        });

    },

    startGrabbing: function() {

        BR.Grabber.openPage('http://ebay.com', 'div#dailyDeals', function() {

            var result = this.evaluate(function() {

                var result = [];

                var new_rates_holders = document.querySelectorAll('div#dailyDeals div.ddcrd.daily-deal');

                for (var i=0; new_rates_holders[i]; i++) {

                    var item = {};

                    item.title = new_rates_holders[i].querySelector('a span.tl').innerText;

                    item.cost  = new_rates_holders[i].querySelector('div.info').innerText;

                    item.image = new_rates_holders[i].querySelector('div.icon img').getAttribute('src');

                    item.url   = new_rates_holders[i].querySelector('a.clr').getAttribute("href");

                    //item.rate = new_rates_holders[i].querySelectorAll('div.fivestar-widget-static-vote span.on').length;

                    //item.message = new_rates_holders[i].querySelector('div.clear').innerText;

                    result.push(item);
                }

                return result;

            });

            this.echo(JSON.stringify(result));

            BR.Grabber.Query = result || [];

            BR.Grabber.processQuery();

            /*
            BR.Grabber.sendToServer({
                'Source': 'ebay.com',
                'Rates': result
            });
            */
        });

    },

    processQuery: function() {

        var item = this.Query[0];

        if (item) {

            this.Query.splice(1, 1);

            BR.Grabber.openPage(item.url, 'h1#itemTitle', function() {

                var item = this.evaluate(function (selector) {

                    var item = {};

                    item.title = document.querySelector('h1#itemTitle').innerText;

                    item.rate  = document.querySelectorAll('span.vi-core-prdReviewCntr i.fullstar').length;
                });

                BR.Grabber.processQuery();

            })

        } else {

            console.log("Complite!" + this.Data);

        }

    },

    openPage: function(url, selector, next) {

        BR.Casper.start(url);

        BR.Casper.then(function() {

            BR.Casper.waitFor(function() {

                return this.evaluate(function (selector) {
                    return document.querySelectorAll(selector).length > 0;
                }, {
                    selector: selector
                });

            }, function() {

                this.echo('Elements successfully found');

            });

        });

        BR.Casper.run(function() {

            next.apply(this, []);

        });
    },

    sendToServer: function(data) {

        console.log('data', data, BR.Config.Url+':'+BR.Config.Port + '/Rates/add');

        setTimeout(function() {

            BR.Casper.done();

        }, 5000);

        BR.Casper.open(BR.Config.Url+':'+BR.Config.Port + '/Rates/add', {
            method: 'POST',
            encoding: "utf8",
            headers: {
                'Content-Type': 'application/json; charset=utf-8'
            },
            data: data
        });

    }

});