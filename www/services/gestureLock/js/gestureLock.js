/**
 * Created by Z.JM on 2016/3/6.
 */
;'use strict';

angular.module('ms.gestureLock', [])
    .factory('$gestureLock', ['$rootScope', '$q', '$ionicLoading', '$timeout', '$document', 'GestureLock', function ($rootScope, $q, $ionicLoading, $timeout, $document, GestureLock) {

        var GESTURE_LOCK_CONFIG = {
            success: {
                lineWidth: 6,
                lineStrokeStyle: "#0a9dc7",
                ringWidth: 2,
                ringStrokeStyle: "#11c1f3",
                pointStrokeStyle: "#11c1f3"
            },
            error: {
                lineWidth: 6,
                lineStrokeStyle: "#e42112",
                ringWidth: 2,
                ringStrokeStyle: "#ef473a",
                pointStrokeStyle: "#ef473a"
            },
            warning: {
                lineWidth: 6,
                lineStrokeStyle: "#e42112",
                ringWidth: 2,
                ringStrokeStyle: "#ef473a",
                pointStrokeStyle: "#ef473a"
            },
            default: {
                lineWidth: 6,
                lineStrokeStyle: "#da562d",
                ringWidth: 2,
                ringStrokeStyle: "#f96c41",
                pointStrokeStyle: "#f96c41"
            },
            matrix: 3,
            spacing: 3.4,
            viewTime: 618,
            verificationTimes: 5
        };
        var GESTURE_LOCK_STATUS = {
            OPENED: "OPENED",
            SUCCESS: "SUCCESS",
            FAILED: "FAILED",
            ERROR: "ERROR",
            CHANGE: "CHANGE",
            CLOSE: "CLOSE",
            OTHER_VERIFICATION: "OTHER_VERIFICATION",
            FORGET_PASSWORD: "FORGET_PASSWORD",
            OTHER_ACCOUNT: "OTHER_ACCOUNT",
            VERIFICATION_TIMES_OUT: "VERIFICATION_TIMES_OUT"
        };

        var GESTURE_LOCK_TYPE = {
            VERIFICATION: "verification",
            SET: "set",
            RESET: "reset"
        };

        var isExitsGestureLock = {
            verification: false,
            set: false,
            reset: false
        };

        function isExits(type) {
            return isExitsGestureLock[type];
        };

        function close(gestureLock) {
            gestureLock.removeAllEventListener();
            $ionicLoading.hide();
            isExitsGestureLock = {
                verification: false,
                set: false,
                reset: false
            };
        }

        function notifyOpened(deferred, type) {
            deferred.notify({status: GESTURE_LOCK_STATUS.OPENED});
            isExitsGestureLock = {
                verification: false,
                set: false,
                reset: false
            };
            isExitsGestureLock[type] = true;
        };

        function setPointStatus(matrix, statusArray) {
            var pointsArray = [];
            for (var i = 0, n = matrix * matrix; i < n; i++) {
                pointsArray.push(false);
            }

            if (angular.isArray(statusArray) && angular.isArray(pointsArray)) {
                for (var i = 0, n = statusArray.length; i < n; i++) {
                    pointsArray[statusArray[i] - 1] = true;
                }
            }
            return pointsArray;
        };

        function verification(verificationPassword, verificationFunction, image, config) {

            var _config = angular.extend({}, GESTURE_LOCK_CONFIG, config || {});
            var deferred = $q.defer();
            var $scope = $rootScope.$new();
            var gestureLock = null;
            var gestureLockPassword = [];
            $scope.image = image;
            $scope.verificationTimes = _config.verificationTimes;
            $scope.errorMessage = null;
            $scope.canvasStyle = {height: "100vmin", width: "100vmin"};
            $scope.pointStatus = new Array(_config.matrix * _config.matrix);

            $scope.$on('$destroy', function () {
                gestureLock && gestureLock.removeAllEventListener();
            });

            $scope.otherVerification = function (type) {
                deferred.reject({status: type});
                close(gestureLock);
            }
            $scope.close = function () {
                deferred.notify({status: GESTURE_LOCK_STATUS.CLOSE});
                close(gestureLock);
            };

            $scope.success = function () {
                deferred.resolve({status: GESTURE_LOCK_STATUS.SUCCESS, message: "解锁成功"});
                close(gestureLock);
            };

            $scope.failed = function () {
                deferred.reject({status: GESTURE_LOCK_STATUS.FAILED, message: "解锁失败"});
                $scope.close(gestureLock);
            };

            $scope.reset = function () {
                $scope.errorMessage = null;
                $scope.pointStatus = setPointStatus(_config.matrix);
                gestureLockPassword = [];
            };

            $scope.opened = function () {

                var _canvas = document.getElementById("_GESTURELOCKVERIFICATIONCANVAS_");
                _canvas.width = window.innerWidth;
                _canvas.height = window.innerWidth;

                $scope.canvasStyle = {height: window.innerWidth + "px", width: window.innerWidth + "px"};
                gestureLock = new GestureLock(_canvas, _config);
                gestureLock.init();
                $scope.reset();

                gestureLock.gestureStart = function (e) {
                    $scope.errorMessage = null;
                    $scope.pointStatus = setPointStatus(_config.matrix, this.getGesturePassword());
                    return;
                };

                gestureLock.gestureEnd = function (e) {

                    var currentGesturePassword = gestureLock.getGesturePassword().join(",");

                    if (angular.isFunction(verificationFunction)) {
                        currentGesturePassword = verificationFunction(currentGesturePassword);
                    }
                    //密码一致
                    if (verificationPassword == currentGesturePassword) {
                        gestureLock.viewStatus("success", {
                            ring: true,
                            line: true,
                            point: true
                        });
                        $timeout(function () {
                            gestureLock.reset();
                            $scope.success();
                        }, _config.viewTime);
                    } else {
                        $scope.verificationTimes = $scope.verificationTimes - 1;
                        //密码不一致提醒
                        $scope.errorMessage = "VERIFICATION_ERROR";
                        deferred.notify({
                            status: GESTURE_LOCK_STATUS.ERROR,
                            password: gestureLock.getGesturePassword()
                        });
                        gestureLock.viewStatus("error", {
                            ring: true,
                            line: true,
                            point: true
                        });
                        $timeout(function () {
                            gestureLock.reset();
                            if ($scope.verificationTimes <= 0) {
                                //超过次数
                                $scope.failed();
                            }
                        }, _config.viewTime);
                    }

                    return;
                };

                gestureLock.gesturePointChange = function (e) {
                    $scope.pointStatus = setPointStatus(_config.matrix, this.getGesturePassword());
                    deferred.notify({status: GESTURE_LOCK_STATUS.CHANGE, password: this});
                    return;
                };

                notifyOpened(deferred, GESTURE_LOCK_TYPE.VERIFICATION);
            };

            $ionicLoading.show({
                templateUrl: "./services/gestureLock/templates/gestureVerification.html",
                scope: $scope,
                noBackdrop: true
            });

            return deferred.promise;
        };

        function set(config) {
            var _config = angular.extend({}, GESTURE_LOCK_CONFIG, config || {});
            var deferred = $q.defer();
            var $scope = $rootScope.$new();
            var gestureLock = null;
            var gestureLockPassword = [];
            $scope.errorMessage = null;
            $scope.gestureLockConfirm = false;
            $scope.canvasStyle = {height: "100vmin", width: "100vmin"};
            $scope.pointStatus = new Array(_config.matrix * _config.matrix);

            $scope.$on('$destroy', function () {
                gestureLock && gestureLock.removeAllEventListener();
            });

            $scope.close = function () {
                deferred.notify({status: GESTURE_LOCK_STATUS.CLOSE});
                close(gestureLock);
            };

            $scope.success = function (gestureLockPassword) {
                deferred.resolve({status: GESTURE_LOCK_STATUS.SUCCESS, password: gestureLockPassword});
                close(gestureLock);
            };

            $scope.failed = function () {
                deferred.reject({status: GESTURE_LOCK_STATUS.FAILED, message: "设置失败"});
                close(gestureLock);
            };

            $scope.reset = function () {
                $scope.errorMessage = null;
                $scope.gestureLockConfirm = false;
                $scope.pointStatus = setPointStatus(_config.matrix);
                gestureLockPassword = [];
            };

            $scope.opened = function (element) {

                var _canvas = document.getElementById("_GESTURELOCKSETCANVAS_");
                _canvas.width = window.innerWidth;
                _canvas.height = window.innerWidth;

                $scope.canvasStyle = {height: window.innerWidth + "px", width: window.innerWidth + "px"};
                gestureLock = new GestureLock(_canvas, _config);
                gestureLock.init();
                $scope.reset();

                gestureLock.gestureStart = function (e) {
                    if (!$scope.gestureLockConfirm) {
                        $scope.pointStatus = setPointStatus(_config.matrix, this.getGesturePassword());
                    }
                    $scope.errorMessage = null;
                    return;
                };

                gestureLock.gestureEnd = function (e) {
                    //密码确认
                    if ($scope.gestureLockConfirm) {
                        //密码一致
                        if (gestureLockPassword.join(",") == gestureLock.getGesturePassword().join(",")) {
                            gestureLock.viewStatus("success", {
                                ring: true,
                                line: true,
                                point: true
                            });
                            $timeout(function () {
                                gestureLock.reset();
                                $scope.success(gestureLockPassword);
                            }, _config.viewTime);
                        } else {
                            //密码不一致提醒
                            $scope.errorMessage = "REPEAT_ERROR";
                            deferred.notify({
                                status: GESTURE_LOCK_STATUS.ERROR,
                                password: gestureLock.getGesturePassword()
                            });
                            gestureLock.viewStatus("error", {
                                ring: true,
                                line: true,
                                point: true
                            });
                            $timeout(function () {
                                gestureLock.reset();
                            }, _config.viewTime);
                        }
                    } else {
                        gestureLockPassword = gestureLock.getGesturePassword();
                        if (gestureLockPassword.length >= 4) {
                            $scope.gestureLockConfirm = true;
                            $scope.errorMessage = null;
                            $scope.pointStatus = setPointStatus(_config.matrix, gestureLockPassword);
                            gestureLock.viewStatus("success", {
                                ring: true,
                                line: true,
                                point: true
                            });
                            $timeout(function () {
                                gestureLock.reset();
                            }, _config.viewTime);
                        } else {
                            //密码过短
                            $scope.errorMessage = "LENGTH_ERROR";
                            $scope.pointStatus = setPointStatus(_config.matrix);
                            gestureLock.viewStatus("error", {
                                ring: true,
                                line: true,
                                point: true
                            });
                            $timeout(function () {
                                gestureLock.reset();
                            }, _config.viewTime);
                        }
                    }

                    return;
                };

                gestureLock.gesturePointChange = function (e) {
                    if (!$scope.gestureLockConfirm) {
                        $scope.pointStatus = setPointStatus(_config.matrix, this.getGesturePassword());
                    }
                    deferred.notify({status: GESTURE_LOCK_STATUS.CHANGE, password: this});
                    return;
                };

                notifyOpened(deferred, GESTURE_LOCK_TYPE.SET);
            };

            $ionicLoading.show({
                templateUrl: "./services/gestureLock/templates/gestureSet.html",
                scope: $scope,
                noBackdrop: true
            });

            return deferred.promise;
        };

        function reset(verificationPassword, verificationFunction, config, isOnlyVerification) {

            var _config = angular.extend({}, GESTURE_LOCK_CONFIG, config || {});
            var deferred = $q.defer();
            var $scope = $rootScope.$new();
            var gestureLock = null;
            var gestureLockPassword = [];
            $scope.errorMessage = null;
            $scope.canvasStyle = {height: "100vmin", width: "100vmin"};
            $scope.pointStatus = new Array(_config.matrix * _config.matrix);
            $scope.isOnlyVerification = isOnlyVerification;

            $scope.$on('$destroy', function () {
                gestureLock && gestureLock.removeAllEventListener();
            });

            $scope.otherVerification = function () {
                deferred.reject({status: GESTURE_LOCK_STATUS.OTHER_VERIFICATION});
                close(gestureLock);
            }
            $scope.close = function () {
                deferred.notify({status: GESTURE_LOCK_STATUS.CLOSE});
                close(gestureLock);
            };

            $scope.success = function () {
                deferred.resolve({status: GESTURE_LOCK_STATUS.SUCCESS, message: "解锁成功"});
                close(gestureLock);
            };

            $scope.failed = function () {
                deferred.reject({status: GESTURE_LOCK_STATUS.FAILED});
                close(gestureLock);
            };

            $scope.reset = function () {
                $scope.errorMessage = null;
                $scope.pointStatus = setPointStatus(_config.matrix);
                gestureLockPassword = [];
            };

            $scope.opened = function () {

                var _canvas = document.getElementById("_GESTURELOCKVERIFICATIONRESETCANVAS_");
                _canvas.width = window.innerWidth;
                _canvas.height = window.innerWidth;

                $scope.canvasStyle = {height: window.innerWidth + "px", width: window.innerWidth + "px"};
                gestureLock = new GestureLock(_canvas, _config);
                gestureLock.init();
                $scope.reset();

                gestureLock.gestureStart = function (e) {
                    $scope.pointStatus = setPointStatus(_config.matrix, this.getGesturePassword());
                    $scope.errorMessage = null;
                    return;
                };

                gestureLock.gestureEnd = function (e) {

                    var currentGesturePassword = gestureLock.getGesturePassword().join(",");

                    if (angular.isFunction(verificationFunction)) {
                        currentGesturePassword = verificationFunction(currentGesturePassword);
                    }

                    //密码一致
                    if (verificationPassword == currentGesturePassword) {
                        gestureLock.viewStatus("success", {
                            ring: true,
                            line: true,
                            point: true
                        });
                        $timeout(function () {
                            //gestureLock.reset();
                            if ($scope.isOnlyVerification) {
                                $scope.success();
                            } else {
                                set(config).then(function (res) {
                                    deferred.resolve(res);
                                }), function (error) {
                                    deferred.reject(error);
                                }, function (notify) {
                                    deferred.notify(notify);
                                };
                            }
                        }, _config.viewTime);
                    } else {
                        //密码不一致提醒
                        $scope.errorMessage = "VERIFICATION_ERROR";
                        deferred.notify({
                            status: GESTURE_LOCK_STATUS.ERROR,
                            password: gestureLock.getGesturePassword()
                        });
                        gestureLock.viewStatus("error", {
                            ring: true,
                            line: true,
                            point: true
                        });
                        $timeout(function () {
                            gestureLock.reset();
                        }, _config.viewTime);
                    }

                    return;
                };

                gestureLock.gesturePointChange = function (e) {
                    $scope.pointStatus = setPointStatus(_config.matrix, this.getGesturePassword());
                    deferred.notify({status: GESTURE_LOCK_STATUS.CHANGE, password: this});
                    return;
                };


                notifyOpened(deferred, GESTURE_LOCK_TYPE.RESET);

            };

            $ionicLoading.show({
                templateUrl: "./services/gestureLock/templates/gestureReset.html",
                scope: $scope
            });

            return deferred.promise;
        };

        return {
            verification: verification,
            set: set,
            reset: reset,
            isExits: isExits,
            close: close,
            GESTURE_LOCK_STATUS: GESTURE_LOCK_STATUS,
            GESTURE_LOCK_TYPE: GESTURE_LOCK_TYPE
        }

    }])
    .factory("GestureLock", [function () {

        /***
         * 画密码圆环
         * @param point     object{x,y}  圆环的圆心坐标 X,Y
         * @param strokeStyle   string   填充颜色
         * @param lineWidth     number  线宽
         */
        var drawRing = function (context2d, point, radii, lineWidth, strokeStyle) {
            context2d.strokeStyle = strokeStyle;
            context2d.lineWidth = lineWidth;
            context2d.beginPath();
            context2d.arc(point.x, point.y, radii, 0, Math.PI * 2, true);
            context2d.closePath();
            context2d.stroke();
        };

        /***
         * 画密码圆环
         * @param points    Array<object{x,y}>
         * @param strokeStyle   string  填充颜色
         * @param lineWidth     number  线宽
         */
        var drawRings = function (context2d, points, radii, lineWidth, strokeStyle) {
            for (var i = 0, n = points.length; i < n; i++) {
                drawRing(context2d, points[i], radii, lineWidth, strokeStyle);
            }
        };

        /***
         * 圆心填充
         * @param fillPoints    string   填充实心点集合
         * @param fillStyle     string   填充颜色
         */
        var drawPoint = function (context2d, point, radii, fillStyle) {
            context2d.fillStyle = fillStyle;
            context2d.beginPath();
            context2d.arc(point.x, point.y, radii, 0, Math.PI * 2, true);
            context2d.closePath();
            context2d.fill();
        };

        /***
         * 圆心填充
         * @param fillPoints    string   填充实心点集合
         * @param fillStyle     string   填充颜色
         */
        var drawPoints = function (context2d, points, radii, fillStyle) {
            for (var i = 0, n = points.length; i < n; i++) {
                drawPoint(context2d, points[i], radii, fillStyle);
            }
        };


        /***
         * 划触点轨迹线条
         * @param cipherPoints  节点集合
         * @param lineWidth number  线条宽度
         */
        var drawLine = function (context2d, points, lineWidth, strokeStyle) {
            context2d.strokeStyle = strokeStyle;
            context2d.lineWidth = lineWidth;

            context2d.beginPath();
            for (var i = 0, n = points.length; i < n; i++) {
                if (i > 0) {
                    context2d.lineTo(points[i].x, points[i].y);
                } else {
                    context2d.moveTo(points[0].x, points[0].y);
                }
            }
            context2d.stroke();
            context2d.closePath();

        };


        // 获取touch点相对于canvas的坐标
        var getPositionbyTouchEvent = function (e, ratio) {
            var rect = e.currentTarget.getBoundingClientRect();
            return {
                x: parseFloat(e.touches[0].clientX - rect.left) * ratio,
                y: parseFloat(e.touches[0].clientY - rect.top) * ratio
            };
        };

        /***
         *
         * @param gestureLock 手势对象
         * @param e
         */
        function touchStartController(gestureLock, e) {

            if (typeof(gestureLock.gestureStart) == "function") {
                gestureLock.gestureStart.call(gestureLock, e);
            }
            var point = getPositionbyTouchEvent(e, gestureLock.config.ratio);

            for (var i = 0; i < gestureLock.activityPoints.length; i++) {
                if (Math.abs(point.x - gestureLock.activityPoints[i].x) < gestureLock.radii && Math.abs(point.y - gestureLock.activityPoints[i].y) < gestureLock.radii) {
                    gestureLock.cipherPoints.push(gestureLock.activityPoints[i]);
                    gestureLock.activityPoints.splice(i, 1);
                    //根据有效节点+当前节点重新划线
                    drawLine(gestureLock.context2d, gestureLock.cipherPoints, gestureLock.config.default.lineWidth, gestureLock.config.default.lineStrokeStyle);
                    //根据有效节点恢复圆心
                    drawPoints(gestureLock.context2d, gestureLock.cipherPoints, gestureLock.radii / 2, gestureLock.config.default.pointStrokeStyle);

                    break;
                }
            }

        }

        /***
         * touchmove事件回调 更新选中节点
         * @param gestureLock
         * @param currentPosition
         */
        function touchMoveController(gestureLock, e) {
            if (typeof(gestureLock.gestureChange) == "function") {
                gestureLock.gestureChange.call(gestureLock, e);
            }

            var currentPosition = getPositionbyTouchEvent(e, gestureLock.config.ratio);
            for (var i = 0; i < gestureLock.activityPoints.length; i++) {
                if (Math.abs(currentPosition.x - gestureLock.activityPoints[i].x) < gestureLock.radii && Math.abs(currentPosition.y - gestureLock.activityPoints[i].y) < gestureLock.radii) {
                    gestureLock.cipherPoints.push(gestureLock.activityPoints[i]);
                    gestureLock.activityPoints.splice(i, 1);

                    if (typeof(gestureLock.gesturePointChange) == "function") {
                        gestureLock.gesturePointChange.call(gestureLock, e);
                    }

                    break;
                }
            }

            //清除所有经过的划线
            gestureLock.context2d.clearRect(0, 0, gestureLock.canvas.width, gestureLock.canvas.height);
            //画出密码单元格
            drawRings(gestureLock.context2d, gestureLock.originalPoints, gestureLock.radii, gestureLock.config.default.ringWidth, gestureLock.config.default.ringStrokeStyle);
            //根据有效节点+当前节点重新划线
            drawLine(gestureLock.context2d, gestureLock.cipherPoints.concat(currentPosition), gestureLock.config.default.lineWidth, gestureLock.config.default.lineStrokeStyle);
            //根据有效节点恢复圆心
            drawPoints(gestureLock.context2d, gestureLock.cipherPoints, gestureLock.radii / 2, gestureLock.config.default.pointStrokeStyle);
        };

        function touchEndController(gestureLock, e) {
            //清除所有经过的划线
            gestureLock.context2d.clearRect(0, 0, gestureLock.canvas.width, gestureLock.canvas.height);
            //画出密码单元格
            drawRings(gestureLock.context2d, gestureLock.originalPoints, gestureLock.radii, gestureLock.config.default.ringWidth, gestureLock.config.default.ringStrokeStyle);
            //根据有效节点+当前节点重新划线
            drawLine(gestureLock.context2d, gestureLock.cipherPoints, gestureLock.config.default.lineWidth, gestureLock.config.default.lineStrokeStyle);
            //根据有效节点恢复圆心
            drawPoints(gestureLock.context2d, gestureLock.cipherPoints, gestureLock.radii / 2, gestureLock.config.default.pointStrokeStyle);

            if (typeof(gestureLock.gestureEnd) == "function") {
                gestureLock.gestureEnd.call(gestureLock, e);
            }
        }


        /**
         * 绑定touchstart、touchmove、touchend事件
         * */
        function documentTouchmove(e) {
            //阻止document 的 touchmove事件
            e.preventDefault();
        }

        var bindEvent = function (_self) {

            document.addEventListener('touchmove', documentTouchmove, false);

            _self.canvas.addEventListener("touchstart", function (e) {
                //某些android的touchmove不宜触发 所以增加此行代码
                e.preventDefault();

                if (!_self.touchFlag && !_self.disabled) {
                    _self.touchFlag = true;
                    _self.disabled = true;
                    touchStartController(_self, e);
                }
            }, false);

            _self.canvas.addEventListener("touchmove", function (e) {
                if (_self.touchFlag) {
                    touchMoveController(_self, e);
                }
            }, false);

            _self.canvas.addEventListener("touchend", function (e) {
                if (_self.touchFlag) {
                    touchEndController(_self, e);
                    _self.touchFlag = false;
                }
            }, false);

        };


        var GestureLock = function (_canvas, _config) {
            var defaultConfig = {
                success: {
                    lineWidth: 3,
                    lineStrokeStyle: "#5cb85c",
                    ringWidth: 2,
                    ringStrokeStyle: "#5cb85c",
                    pointStrokeStyle: "#5cb85c"
                },
                error: {
                    lineWidth: 3,
                    lineStrokeStyle: "#d9534f",
                    ringWidth: 2,
                    ringStrokeStyle: "#d9534f",
                    pointStrokeStyle: "#d9534f"
                },
                warning: {
                    lineWidth: 3,
                    lineStrokeStyle: "#f0ad4e",
                    ringWidth: 2,
                    ringStrokeStyle: "#f0ad4e",
                    pointStrokeStyle: "#f0ad4e"
                },
                default: {
                    lineWidth: 3,
                    lineStrokeStyle: "#5bc0de",
                    ringWidth: 2,
                    ringStrokeStyle: "#5bc0de",
                    pointStrokeStyle: "#5bc0de"
                },
                matrix: 3,
                ratio: 2,
                spacing: 3.4
            };

            this.gestureStart = undefined;
            this.gestureChange = undefined;
            this.gesturePointChange = undefined;
            this.gestureEnd = undefined;

            this.config = angular.extend({}, defaultConfig, _config || {});

            this.touchFlag = false;

            this.disabled = false;

            this.radii = 0;

            this.cipherPoints = [];
            this.activityPoints = [];
            this.originalPoints = [];
            this.canvas = _canvas;

            this.config.ratio = getPixelRatio(_canvas.getContext('2d'));

            this.canvas.width = this.canvas.width * this.config.ratio;
            this.canvas.height = this.canvas.height * this.config.ratio;


            this.context2d = _canvas.getContext('2d');
            //绑定事件
            bindEvent(this);
        };

        /***
         * 初始化矩阵 数组
         * @param _self初始化对象
         */
        GestureLock.prototype.init = function () {
            var matrix = this.config.matrix;
            var spacing = this.config.spacing;
            var count = 0;
            this.radii = this.canvas.width / ( spacing * matrix);
            //原始点集合
            this.originalPoints = [];

            for (var i = 0, n = matrix; i < n; i++) {
                for (var j = 0, m = matrix; j < m; j++) {
                    count++;
                    var _o = {
                        x: j * spacing * this.radii + spacing / 2.0 * this.radii,
                        y: i * spacing * this.radii + spacing / 2.0 * this.radii,
                        index: count
                    };
                    this.originalPoints.push(_o);
                }
            }
            this.reset();
            return this;
        };


        GestureLock.prototype.reset = function () {
            //擦除面板
            this.activityPoints = [].concat(this.originalPoints);
            this.cipherPoints = [];
            this.context2d.clearRect(0, 0, this.canvas.width, this.canvas.height);
            drawRings(this.context2d, this.originalPoints, this.radii, this.config.default.ringWidth, this.config.default.ringStrokeStyle);
            this.disabled = false;
        };

        GestureLock.prototype.viewStatus = function (_type, _viewConfig) {
            var viewConfig = {
                ring: true,
                line: false,
                point: false
            };
            viewConfig = angular.extend(viewConfig, _viewConfig);
            if (viewConfig.ring) {
                drawRings(this.context2d, this.cipherPoints, this.radii, this.config[_type].ringWidth, this.config[_type].ringStrokeStyle);
            }
            if (viewConfig.line) {
                drawLine(this.context2d, this.cipherPoints, this.config[_type].lineWidth, this.config[_type].lineStrokeStyle);
            }
            if (viewConfig.point) {
                drawPoints(this.context2d, this.cipherPoints, this.radii / 2, this.config[_type].pointStrokeStyle);
            }
        };

        GestureLock.prototype.getGesturePassword = function () {
            return this.cipherPoints.map(function (_object) {
                return _object.index;
            });
        };

        GestureLock.prototype.validatePassword = function (originalPassword, password) {
            var result = true;
            if (!originalPassword || !password) {
                return false;
            }
            if (originalPassword.length != password.length) {
                return false;
            }
            for (var i = 0, n = originalPassword.length; i < n; i++) {
                if (originalPassword[i] !== password[i]) {
                    result = false;
                    break;
                }
            }
            return result;
        };

        GestureLock.prototype.removeAllEventListener = function () {
            document.removeEventListener('touchmove', documentTouchmove, false);
        };

        var getPixelRatio = function (context) {
            var backingStore = context.backingStorePixelRatio ||
                context.webkitBackingStorePixelRatio ||
                context.mozBackingStorePixelRatio ||
                context.msBackingStorePixelRatio ||
                context.oBackingStorePixelRatio ||
                context.backingStorePixelRatio || 1;
            return parseFloat(window.devicePixelRatio || 1) / parseFloat(backingStore);
        };


        return GestureLock;

    }]);
