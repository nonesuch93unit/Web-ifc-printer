'use strict';

// Declare app level module which depends on views, and components
angular.module('myApp', [
  'ngRoute',
  'myApp.view1',
  'myApp.view2',
  'myApp.version',
  'btford.socket-io',
    'ngMaterial'
]).
config(['$routeProvider', function($routeProvider) {
  $routeProvider.otherwise({redirectTo: '/view1'});
}])
    .filter('keyboardShortcut', function($window) {
      return function(str) {
        if (!str) return;
        var keys = str.split('-');
        var isOSX = /Mac OS X/.test($window.navigator.userAgent);
        var seperator = (!isOSX || keys.length > 2) ? '+' : '';
        var abbreviations = {
          M: isOSX ? '⌘' : 'Ctrl',
          A: isOSX ? 'Option' : 'Alt',
          S: 'Shift'
        };
        return keys.map(function(key, index) {
          var last = index == keys.length - 1;
          return last ? key : abbreviations[key];
        }).join(seperator);
      };
    })
    .directive('header', function () {
      return {
        restrict: 'A', //This menas that it will be used as an attribute and NOT as an element. I don't like creating custom HTML elements
        replace: true,
        scope: {user: '='}, // This is one of the cool things :). Will be explained in post.
        templateUrl: "view2/view2.html",
        controller: ['$scope', '$filter', function ($scope, $filter) {
          // Your behaviour goes here :)
        }]
      }
    })
    .
    factory('mySocket', function (socketFactory) {
      var myIoSocket = io.connect('http://164.132.225.122:8124');

      var mySocket = socketFactory({
        ioSocket: myIoSocket
      });
      return mySocket;
    });
