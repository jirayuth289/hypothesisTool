angular.module('userControllers', ['userServices'])

.controller('regCtrl', function($http, $location, $timeout, User, $route) {

    var app = this;

    // Custom function that registers the user in the database		
    this.regUser = function(regData, valid, confirmed) {
        app.disabled = true; // Disable the form when user submits to prevent multiple requests to server
        app.loading = true; // Activate bootstrap loading icon
        app.errorMsg = false; // Clear errorMsg each time user submits

        // If form is valid and passwords match, attempt to create user			
        if (valid && confirmed) {
            // Runs custom function that registers the user in the database	
            User.create(app.regData).then(function(data) {
                // Check if user was saved to database successfully
                if (data.data.success) {
                    app.loading = false; // Stop bootstrap loading icon
                    app.successMsg = data.data.message + '...Redirecting'; // If successful, grab message from JSON object and redirect to login page
                    // Redirect after 2000 milliseconds (2 seconds)
                    $timeout(function() {
                        $location.path('/login');
                    }, 2000);
                } else {
                    app.loading = false; // Stop bootstrap loading icon
                    app.disabled = false; // If error occurs, remove disable lock from form
                    app.errorMsg = data.data.message; // If not successful, grab message from JSON object
                }
            });
        } else {
            app.disabled = false; // If error occurs, remove disable lock from form
            app.loading = false; // Stop bootstrap loading icon
            app.errorMsg = 'กรุณาตรวจสอบความถูกต้องของข้อมูล'; // Display error if valid returns false
        }
    };

    this.checkUsername = function(regData) {
        app.checkingUsername = true;
        app.usernameMsg = false;
        app.usernameInvalid = false;

        User.checkUsername(app.regData).then(function(data) {
            if (data.data.success) {
                app.checkingUsername = false;
                app.usernameInvalid = false;
                app.usernameMsg = data.data.message;
            } else {
                app.checkingUsername = false;
                app.usernameInvalid = true;
                app.usernameMsg = data.data.message;
            }
        });
    };

    this.checkEmail = function(regData) {
        app.checkingEmail = true;
        app.emailMsg = false;
        app.emailInvalid = false;

        User.checkEmail(app.regData).then(function(data) {
            if (data.data.success) {
                app.checkingEmail = false;
                app.emailInvalid = false;
                app.emailMsg = data.data.message;
            } else {
                app.checkingEmail = false;
                app.emailInvalid = true;
                app.emailMsg = data.data.message;
            }
        });
    };
})

.directive('match', function() {
    return {
        restrict: 'A',
        controller: function($scope) {
            $scope.confirmed = false;

            $scope.doConfirm = function(values) {

                values.forEach(function(ele) {
                    if ($scope.confirm == ele) {
                        $scope.confirmed = true;
                    } else {
                        $scope.confirmed = false;
                    }
                });
            }
        },
        link: function(scope, element, attrs) {

            attrs.$observe('match', function() {
                scope.matches = JSON.parse(attrs.match);
                scope.doConfirm(scope.matches);
            });

            scope.$watch('confirm', function() {
                scope.matches = JSON.parse(attrs.match);
                scope.doConfirm(scope.matches);
            });
        }
    };
})

// Controller: facebookCtrl is used finalize facebook login
.controller('facebookCtrl', function($routeParams, Auth, $location, $window) {

    var app = this;
    app.errorMsg = false; // Clear errorMsg on page load
    app.expired = false; // Clear expired on page load
    app.disabled = true; // On page load, remove disable lock from form

    // Check if callback was successful 
    if ($window.location.pathname == '/facebookerror') {
        app.errorMsg = 'ไม่พบข้อมูลอีเมล Facebook ของคุณในระบบ'; // If error, display custom message
    } else if ($window.location.pathname == '/facebook/inactive/error') {
        app.expired = true; // Variable to activate "Resend Link Button"
        app.errorMsg = 'บัญชีของคุณยังไม่ยืนยันการสมัครสมาชิก โปรดตรวจสอบอีเมลของคุณเพื่อยันยืนการสมัครสมาชิก'; // If error, display custom message
    } else {
        Auth.setToken($routeParams.token); // If no error, set the token
        $location.path('/diagList'); // Redirect to home page
    }
})

// Controller: googleCtrl is used finalize facebook login	
.controller('googleCtrl', function($routeParams, Auth, $location, $window) {

    var app = this;
    app.errorMsg = false; // Clear errorMsg on page load
    app.expired = false; // Clear expired on page load
    app.disabled = true; // On page load, remove disable lock from form

    // Check if callback was successful 		
    if ($window.location.pathname == '/googleerror') {
        app.errorMsg = 'ไม่พบข้อมูลอีเมล Google ของคุณในระบบ'; // If error, display custom message
    } else if ($window.location.pathname == '/google/inactive/error') {
        app.expired = true; // Variable to activate "Resend Link Button"
        app.errorMsg = 'บัญชีของคุณยังไม่ยืนยันการสมัครสมาชิก โปรดตรวจสอบอีเมลของคุณเพื่อยันยืนการสมัครสมาชิก'; // If error, display custom message
    } else {
        Auth.setToken($routeParams.token); // If no error, set the token
        $location.path('/diagList'); // Redirect to home page
    }
});