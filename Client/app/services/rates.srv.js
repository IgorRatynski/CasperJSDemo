angular.module('bestrate').service('RatesSrv', ['$rootScope', function($rootScope) {

    this.Filter = '';

    this.Rates = [];

    this.RatesHash = {};

    this.setRates = function(rates) {

        _.each(rates, function(rate) {

            $rootScope.RatesSrv.RatesHash[rate._id] = rate;

        });

        $rootScope.RatesSrv.Rates = _.values($rootScope.RatesSrv.RatesHash);

        $rootScope.RatesSrv.Rates = _.sortBy($rootScope.RatesSrv.Rates, function(rate) {
            return rate.Date;
        });

        $rootScope.RatesSrv.Rates.reverse();

    };

    this.setFilter = function(filter) {

        this.Filter = filter;

        console.log('filter: ', filter);

        if (filter) $rootScope.ConnectionSrv.send({
            Action: 'getRates',
            Filter: this.Filter
        });

    };

}]);
