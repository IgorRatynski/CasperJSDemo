angular.module('bestrate').directive('searchResults', [function(){

    return {

        restrict: 'E',

        replace: true,

        templateUrl: 'app/components/search-results/search-results.htm',

        link: function(scope, el, attrs){



        },

        controller: ['$scope', function ($scope) {

            $scope.filterResults = function(item) {

                if (!$scope.RatesSrv.Filter) return true;

                if (item.Title.indexOf($scope.RatesSrv.Filter) >= 0) return true;

                return false;

            }

        }]
    };

}]);