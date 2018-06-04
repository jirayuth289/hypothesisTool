var app = angular.module('appRoutes', ['ngRoute'])

.config(function($routeProvider, $locationProvider) {

    $routeProvider
    // Create routes

        .when('/', {
        title: 'สร้างสมมติฐานโครงงานวิจัยด้วยเครื่องมือสนับสนุนการคิดเชิงระบบ',
        templateUrl: 'app/views/pages/users/login.html',
    })

    // Home Route 
    .when('/home', {
        title: 'สร้างสมมติฐานโครงงานวิจัยด้วยเครื่องมือสนับสนุนการคิดเชิงระบบ',
        templateUrl: 'app/views/pages/home.html'
    })

    // Aboute Route            
    .when('/about', {
        title: 'สร้างสมมติฐานโครงงานวิจัยด้วยเครื่องมือสนับสนุนการคิดเชิงระบบ',
        templateUrl: 'app/views/pages/about.html'
    })


    // Register Route            
    .when('/register', {
        title: 'สมัครสมาชิก',
        templateUrl: 'app/views/pages/users/register.html',
        controller: 'regCtrl',
        controllerAs: 'register',
        authenticated: false
    })

    .when('/login', {
        title: 'เข้าสู่ระบบ',
        templateUrl: 'app/views/pages/users/login.html',
        controller: 'mainCtrl',
        controllerAs: 'main',
        authenticated: false
    })

    .when('/logout', {
        templateUrl: 'app/views/pages/users/logout.html',
        authenticated: true
    })

    .when('/profile', {
        title: 'โปรไฟล์',
        templateUrl: 'app/views/pages/users/profile.html',
        authenticated: true
    })

    .when('/diagManage/:id?', {
        title: 'สร้างผังเหตุผล',
        templateUrl: 'app/views/pages/management/diagram/diagram.html',
        controller: 'diagramCtrl',
        controllerAs: 'diag',
        authenticated: true
    })


    .when('/diagList', {
        title: 'รายการผังเหตุผลทั้งหมด',
        templateUrl: 'app/views/pages/management/diagram/list.html',
        controller: 'diagramListCtrl',
        controllerAs: 'lsDiag',
        authenticated: true
    })

    .when('/manual', {
            templateUrl: 'app/views/pages/management/diagram/manual.html',
        })
        //----------------------social
        .when('/facebook/:token', {
            templateUrl: 'app/views/pages/users/social/social.html',
            controller: 'facebookCtrl',
            controllerAs: 'facebook',
            authenticated: false
        })


    // Route: Google Callback Result
    .when('/google/:token', {
        templateUrl: 'app/views/pages/users/social/social.html',
        controller: 'googleCtrl',
        controllerAs: 'google',
        authenticated: false
    })

    .when('/facebookerror', {
        templateUrl: 'app/views/pages/users/login.html',
        controller: 'facebookCtrl',
        controllerAs: 'facebook',
        authenticated: false
    })

    // Route: Google Error
    .when('/googleerror', {
        templateUrl: 'app/views/pages/users/login.html',
        controller: 'googleCtrl',
        controllerAs: 'google',
        authenticated: false
    })

    .when('/facebook/inactive/error', {
        templateUrl: 'app/views/pages/users/login.html',
        controller: 'facebookCtrl',
        controllerAs: 'facebook',
        authenticated: false
    })

    .when('/google/inactive/error', {
        templateUrl: 'app/views/pages/users/login.html',
        controller: 'googleCtrl',
        controllerAs: 'google',
        authenticated: false
    })

    .when('/activate/:token', {
        templateUrl: 'app/views/pages/users/activation/activate.html',
        controller: 'emailCtrl',
        controllerAs: 'email',
        authenticated: false
    })

    .when('/resend', {
        templateUrl: 'app/views/pages/users/activation/resend.html',
        controller: 'resendCtrl',
        controllerAs: 'resend',
        authenticated: false

    })

    // Route: Send Username to E-mail
    .when('/resetusername', {
        templateUrl: 'app/views/pages/users/reset/username.html',
        controller: 'usernameCtrl',
        controllerAs: 'username',
        authenticated: false
    })

    // Route: Send Password Reset Link to User's E-mail
    .when('/resetpassword', {
        templateUrl: 'app/views/pages/users/reset/password.html',
        controller: 'passwordCtrl',
        controllerAs: 'password',
        authenticated: false
    })

    // Route: User Enter New Password & Confirm
    .when('/reset/:token', {
        templateUrl: 'app/views/pages/users/reset/newpassword.html',
        controller: 'resetCtrl',
        controllerAs: 'reset',
        authenticated: false
    })

    // Route: Manage User Accounts
    .when('/management', {
        title: 'จัดการข้อมูลผู้ใช้งาน',
        templateUrl: 'app/views/pages/management/management.html',
        controller: 'managementCtrl',
        controllerAs: 'management',
        authenticated: true,
        permission: ['admin', 'moderator']
    })

    // Route: Edit a User
    .when('/edit/:id', {
        title: 'จัดการข้อมูลผู้ใช้งาน',
        templateUrl: 'app/views/pages/management/edit.html',
        controller: 'editCtrl',
        controllerAs: 'edit',
        authenticated: true,
        permission: ['admin', 'moderator']
    })

    .when('/testList', {
        title: 'รายการแบบทดสอบ',
        templateUrl: 'app/views/pages/management/diagram/testList.html',
        controller: 'diagramListCtrl',
        controllerAs: 'lsDiag',
        authenticated: true
    })

    .when('/test/:id?', {
        title: 'ฝึกสร้างแผนผังเหตุผล',
        templateUrl: 'app/views/pages/management/diagram/test.html',
        controller: 'testCtrl',
        controllerAs: 'test',
        authenticated: true
    })


    .otherwise({ redirectTo: '/' }); // If user tries to access any other route, redirect to home page

    $locationProvider.html5Mode({ enabled: true, requireBase: false }); // Required to remove AngularJS hash from URL (no base is required in index file)
});

// Run a check on each route to see if user is logged in or not (depending on if it is specified in the individual route)
app.run(['$rootScope', 'Auth', '$location', 'User', function($rootScope, Auth, $location, User) {

    // Check each time route changes    
    $rootScope.$on('$routeChangeStart', function(event, next, current) {
        $rootScope.title = next.$$route.title;
        // Only perform if user visited a route listed above
        if (next.$$route !== undefined) {

            // Check if authentication is required on route
            if (next.$$route.authenticated === true) {
                // Check if authentication is required, then if permission is required
                if (!Auth.isLoggedIn()) {
                    event.preventDefault(); // If not logged in, prevent accessing route
                    $location.path('/'); // Redirect to home instead
                } else if (next.$$route.permission) {
                    // Function: Get current user's permission to see if authorized on route
                    User.getPermission().then(function(data) {
                        // Check if user's permission matches at least one in the array
                        if (next.$$route.permission[0] !== data.data.permission) {
                            if (next.$$route.permission[1] !== data.data.permission) {
                                event.preventDefault(); // If at least one role does not match, prevent accessing route
                                $location.path('/diagList'); // Redirect to home instead
                            }
                        }
                    });
                }
            } else if (next.$$route.authenticated === false) {
                // If authentication is not required, make sure is not logged in
                if (Auth.isLoggedIn()) {
                    event.preventDefault(); // If user is logged in, prevent accessing route
                    $location.path('/diagList'); // Redirect to diagList instead
                }
            }
        }
    });
}]);