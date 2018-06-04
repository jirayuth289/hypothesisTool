// Main application configuration file
angular.module('userApp', ['appRoutes', 'userControllers', 'userServices', 'ngAnimate', 'mainController', 'authServices', 'diagramControllers', 'diagramServices', 'diagramListController', 'emailController', 'managementController', 'testController'])

.config(function($httpProvider) {
    $httpProvider.interceptors.push('AuthInterceptors');
});