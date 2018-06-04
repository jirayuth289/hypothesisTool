angular.module('authServices', [])

.factory('Auth', function($http, AuthToken) {
    var authFactory = {};

    authFactory.login = function(loginData) {
        return $http.post('/api/authenticate', loginData).then(function(data) {
            AuthToken.setToken(data.data.token);
            return data;
        });
    };

    // Auth.isLoggedIn();
    authFactory.isLoggedIn = function() {
        if (AuthToken.getToken()) {
            return true;
        } else {
            return false;
        }
    };;
    // Auth.facebook(token)
    authFactory.setToken = function(token) {
        AuthToken.setToken(token);
    };

    //Auth.getuser();
    authFactory.getUser = function() {
        if (AuthToken.getToken()) {
            return $http.post('/api/me');
        } else {
            $q.reject({ message: 'User has no token' });
        }
    };

    // Auth.logout();
    authFactory.logout = function() {
        AuthToken.setToken();
    }

    return authFactory;
})

.factory('AuthToken', function($window) {
    var AuthTokenFactory = {};

    // AuthToken.setToken(token);
    AuthTokenFactory.setToken = function(token) {
        if (token) {
            $window.localStorage.setItem('token', token);
        } else {
            $window.localStorage.removeItem('token');
        }
    };

    // AuthToken.getToken();
    AuthTokenFactory.getToken = function() {
        return $window.localStorage.getItem('token');
    }
    return AuthTokenFactory;
})

.factory('AuthInterceptors', function(AuthToken) {
    var AuthInterceptorsFactory = {};

    AuthInterceptorsFactory.request = function(config) {
        var token = AuthToken.getToken();

        if (config) config.headers['x-access-token'] = token;

        return config;
    };

    return AuthInterceptorsFactory;
});