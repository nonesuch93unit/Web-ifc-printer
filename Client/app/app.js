'use strict';

// Declare app level module which depends on views, and components
angular.module('myApp', [
  'ngRoute',
  'myApp.view1',
  'btford.socket-io',
    'ngMaterial'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.otherwise({redirectTo: '/view1'});
}])
    .
    factory('mySocket', function (socketFactory) {
      var myIoSocket = io.connect('http://164.132.225.122:8080');

      var mySocket = socketFactory({
        ioSocket: myIoSocket
      });
      return mySocket;
    });
