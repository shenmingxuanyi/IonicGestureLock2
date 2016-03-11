/**
 * Created by Z.JM on 2016/3/6.
 */
;'use strict';

angular.module('ms.featureGuide', [])
    .factory('$FeatureGuide', ['$rootScope', '$q', '$ionicLoading', '$timeout', function ($rootScope, $q, $ionicLoading, $timeout) {
        var FEATURE_GUIDE_STATUS = {
            OPENED: "OPENED",
            SUCCESS: "SUCCESS",
            FAILED: "FAILED",
            CHANGE: "CHANGE",
            CLOSE: "CLOSE"
        };

        var FEATURE_GUIDE_TYPE = {
            SHOW: "show"
        };

        var isExitsFeatureGuide = false;


        var FEATURE_GUIDE_CONFIG = {
            autoPlay: false,
            slideInterval: 4000,
            showPager: true
        }

        function close() {
            $ionicLoading.hide();
            isExitsFeatureGuide = false;
        }

        function notifyOpened(deferred) {
            deferred.notify({status: FEATURE_GUIDE_STATUS.OPENED});
            isExitsFeatureGuide = true;
        };

        function show(images, config) {
            var deferred = $q.defer();
            var $scope = $rootScope.$new();

            $scope.config = angular.extend({}, FEATURE_GUIDE_CONFIG, config || {});

            $scope.images = images;

            if (null == images || images.length <= 0) {
                $scope.close();
            }

            $scope.close = function () {
                deferred.notify({status: FEATURE_GUIDE_STATUS.CLOSE});
                close();
            };

            $scope.success = function () {
                deferred.resolve({status: FEATURE_GUIDE_STATUS.SUCCESS});
                close();
            };

            $scope.failed = function () {
                deferred.reject({status: FEATURE_GUIDE_STATUS.FAILED});
                $scope.close();
            };

            $scope.opened = function () {
                notifyOpened(deferred);
            };

            $scope.slideHasChanged = function (index) {
                deferred.notify({status: FEATURE_GUIDE_STATUS.CHANGE, index: index});
            };

            $ionicLoading.show({
                templateUrl: "./services/featureGuide/templates/featureGuide.html",
                scope: $scope,
                noBackdrop: true
            });

            return deferred.promise;
        };

        return {
            show: show,
            close: close,
            FEATURE_GUIDE_STATUS: FEATURE_GUIDE_STATUS,
            FEATURE_GUIDE_TYPE: FEATURE_GUIDE_TYPE,
            isShow: function () {
                return isExitsFeatureGuide;
            }
        }

    }]);