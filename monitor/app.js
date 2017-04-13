agGrid.initialiseAgGridWithAngular1(angular);
var myApp = angular.module('app', ['ui.bootstrap','angular.ping', 'ngRoute', 'agGrid']);
//var r = require("rethinkdb");
var socket = io.connect();
var socketLive = io.connect('https://server-sagi-uziel.c9users.io:8081');


// myApp.config(['$locationProvider', '$routeProvider', function ($locationProvider, $routeProvider) {
//     $routeProvider
//     .when('/', {
//         templateUrl:'Main.html',
//         controller: 'MainController'
//     })
//     .when("/Db",{
//         templateUrl:"../Db/Db.html"
//     });
//     // .when("/Login",{
//     //     templateUrl:"Login/Login.html",
//     //     controller: "LoginController"
//     // });
// }]);


// var thinky = require('thinky')({ db: 'WriteNow' });
//var express = require('express');
//var r = require('rethinkdb');

//var thinky = require('thinky')({ db: 'WriteNow' });
// this.r = thinky.r;