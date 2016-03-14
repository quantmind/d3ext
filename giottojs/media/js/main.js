require([
    'js/require.config',
    'angular',
    'giotto',
    'js/colorbrewer',
    'js/data',
    'lux/forms/main',
    'lux/nav/main',
    'lux/page/main',
    'lux/components/highlight',
    'angular-sanitize'
], function(lux, angular, d3, colorbrewer) {
    'use strict';

    //
    // Inject colorBrewer
    d3.colorbrewer = colorbrewer;

    // Ceate giotto angular module
    d3.angularModule(angular);

    //
    // Main angular module for giottojs
    angular.module('giottojs.main', [
        'lux.sidebar',
        'lux.form',
        'lux.router',
        'lux.highlight',
        'giotto',
        'giottojs.data'])
        .constant('giottojsNavigation', {
            brand: 'GiottoJS',
            brandImage: lux.media('giottojs/giotto-banner.svg'),
            top: true,
            fixed: true,
            target: '_self',
            itemsRight: [
                {
                    href: '/examples',
                    icon: 'fa fa-bar-chart',
                    label: 'examples',
                    target: '_self'
                },
                {
                    href: '/api',
                    icon: 'fa fa-cogs',
                    label: 'api'
                },
                {
                    href: 'https://github.com/quantmind/giotto',
                    icon: 'fa fa-github'
                }
            ]
        })
        .config(['giottoDefaults', function (giottoDefaults) {
            giottoDefaults.contextMenu = [];
        }])
        .run(['$rootScope', '$lux', 'context', 'giottojsNavigation',
            function ($scope, $lux, context, giottojsNavigation) {
                $scope.navbar = giottojsNavigation;
                $scope.d3 = d3;
            }]
        );

    lux.bootstrap('giottojs', ['giottojs.main']);
});
