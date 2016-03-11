angular.module('starter.controllers', [])

    .controller('DashCtrl', ['$scope', '$ionicPopup', '$timeout', '$interval', '$gestureLock', '$ionicBackdrop', '$ionicLoading', function ($scope, $ionicPopup, $timeout, $interval, $gestureLock, $ionicBackdrop, $ionicLoading) {

        $scope.time = 0;

        $interval(function () {
            $scope.time = $scope.time + 1;
        }, 1000);
        $scope.sm = {
            sm: "sm",
            name: [1, 2, 3, 4, 5],
            age: {
                age: 24
            }
        };

        $scope.openSelect = function () {
            $scope.data = {};

            // An elaborate, custom popup
            var myPopup = $ionicPopup.show({
                templateUrl: 'templates/plugin/selectModal.html',
                title: "请选择",
                //subTitle: "请选择",
                scope: $scope,
                cssClass: "ionic-popup-select",
                buttons: [
                    {
                        text: '确定',
                        type: 'button-light',
                        onTap: function (e) {
                            e.preventDefault();

                        }
                    },
                    {
                        text: '取消',
                        type: 'button-light',
                        onTap: function (e) {
                            //e.preventDefault();
                        }
                    }
                ]
            });

            myPopup.then(function (res) {
                console.log('Tapped!', res);
            });

            $scope.onSelect = function (obj) {
                myPopup.close(obj);
            };
        };


        $scope.setGestureLock = function () {

            $gestureLock.set().then(function (res) {
                //console.log("successResult:" + JSON.stringify(res));
            }, function (error) {
                //console.log("errorResult:" + JSON.stringify(error));
            }, function (notify) {
                //console.log("notify:" + JSON.stringify(notify));
            });

        };

        $scope.resetGestureLock = function () {
            $gestureLock.reset("3,2,1,4,7,8,9,6,5").then(function (password) {

            }, function (error) {

            }, function (notify) {

            });
        };

        $scope.verificationGestureLock = function () {

            $gestureLock.verification("3,2,1,4,7,8,9,6,5",null,"img/ben.png").then(function (password) {

            }, function (error) {

            }, function (notify) {

            });

        };

        $scope.release = function () {
            $ionicBackdrop.release();
        };

        $scope.retain = function () {
            $ionicBackdrop.retain();
        };


        $scope.loading = function () {

            $ionicLoading.show({
                template: "<ion-spinner></ion-spinner>123213"
            });

            $timeout(function () {
                $ionicLoading.hide();
            }, 3000);

        };

    }])

    .controller('ChatsCtrl', function ($scope, Chats, $FeatureGuide) {
        // With the new view caching in Ionic, Controllers are only called
        // when they are recreated or on app start, instead of every page change.
        // To listen for when this page is active (for example, to refresh data),
        // listen for the $ionicView.enter event:
        //
        //$scope.$on('$ionicView.enter', function(e) {
        //});

        $scope.chats = Chats.all();
        $scope.remove = function (chat) {
            Chats.remove(chat);
        };

        $scope.show = function () {
            $FeatureGuide.show(["./img/guide/1.png", "./img/guide/2.png", "./img/guide/3.png", "./img/guide/4.png", "./img/guide/5.png"]).then(function () {

            }, function () {

            });
        };

        $scope.hide = function () {
            $FeatureGuide.close();
        };
    })

    .controller('ChatDetailCtrl', function ($scope, $stateParams, Chats) {
        $scope.chat = Chats.get($stateParams.chatId);
    })

    .controller('AccountCtrl', function ($scope) {
        $scope.settings = {
            enableFriends: true
        };
    });
