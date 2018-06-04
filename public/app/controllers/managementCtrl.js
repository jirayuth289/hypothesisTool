angular.module('managementController', [])

// Controller: User to control the management page and managing of user accounts
.controller('managementCtrl', function(User) {
    var app = this;

    app.loading = true; // Start loading icon on page load
    app.accessDenied = true; // Hide table while loading
    app.errorMsg = false; // Clear any error messages
    app.editAccess = false; // Clear access on load
    app.deleteAccess = false; // CLear access on load
    app.limit = 5; // Set a default limit to ng-repeat

    // Function: get all the users from database
    function getUsers() {
        // Runs function to get all the users from database
        User.getUsers().then(function(data) {
            // Check if able to get data from database
            if (data.data.success) {
                // Check which permissions the logged in user has
                if (data.data.permission === 'admin' || data.data.permission === 'moderator') {
                    app.users = data.data.users; // Assign users from database to variable
                    app.loading = false; // Stop loading icon
                    app.accessDenied = false; // Show table

                    // Check if logged in user is an admin or moderator
                    if (data.data.permission === 'admin') {
                        app.editAccess = true; // Show edit button
                        app.deleteAccess = true; // Show delete button
                    } else if (data.data.permission === 'moderator') {
                        app.editAccess = true; // Show edit button
                    }
                } else {
                    app.errorMsg = 'Insufficient Permissions'; // Reject edit and delete options
                    app.loading = false; // Stop loading icon
                }
            } else {
                app.errorMsg = data.data.message; // Set error message
                app.loading = false; // Stop loading icon
            }
        });
    }

    getUsers(); // Invoke function to get users from databases

    // Function: Show more results on page
    app.showMore = function(number) {
        app.showMoreError = false; // Clear error message
        // Run functio only if a valid number above zero
        if (number > 0) {
            app.limit = number; // Change ng-repeat filter to number requested by user
        } else {
            app.showMoreError = 'Please enter a valid number'; // Return error if number not valid
        }
    };

    // Function: Show all results on page
    app.showAll = function() {
        app.limit = undefined; // Clear ng-repeat limit
        app.showMoreError = false; // Clear error message
    };

    // Function: Delete a user
    app.deleteUser = function(username) {
        User.deleteUser(username).then(function(data) {
            if (data.data.success) {
                getUsers(); // Reset users on page
            } else {
                app.showMoreError = data.data.message; // Set error message
            }
        });
    };

    //set 
    app.numberResults = {
        options: [5, 10, 15, 20, 25, 50],
        selectedOption: 5
    };
})

// Controller: Used to edit users
.controller('editCtrl', function($scope, $routeParams, User, $timeout) {
    var app = this;
    $scope.nameTab = 'active'; // Set the 'name' tab to the default active tab
    app.phase1 = true; // Set the 'name' tab to default view

    // Function: get the user that needs to be edited
    User.getUser($routeParams.id).then(function(data) {
        // Check if the user's _id was found in database
        if (data.data.success) {
            $scope.newName = data.data.user.name; // Display user's name in scope
            $scope.newEmail = data.data.user.email; // Display user's e-mail in scope
            $scope.newUsername = data.data.user.username; // Display user's username in scope
            $scope.newPermission = data.data.user.permission; // Display user's permission in scope
            app.currentUser = data.data.user._id; // Get user's _id for update functions
        } else {
            app.errorMsg = data.data.message; // Set error message
        }
    });

    // Function: Set the name pill to active
    app.namePhase = function() {
        $scope.nameTab = 'active'; // Set name list to active
        $scope.usernameTab = 'default'; // Clear username class
        $scope.emailTab = 'default'; // Clear email class
        $scope.permissionsTab = 'default'; // Clear permission class
        app.phase1 = true; // Set name tab active
        app.phase2 = false; // Set username tab inactive
        app.phase3 = false; // Set e-mail tab inactive
        app.phase4 = false; // Set permission tab inactive
        app.errorMsg = false; // Clear error message
    };

    // Function: Set the e-mail pill to active
    app.emailPhase = function() {
        $scope.nameTab = 'default'; // Clear name class
        $scope.usernameTab = 'default'; // Clear username class
        $scope.emailTab = 'active'; // Set e-mail list to active
        $scope.permissionsTab = 'default'; // Clear permissions class
        app.phase1 = false; // Set name tab to inactive
        app.phase2 = false; // Set username tab to inactive
        app.phase3 = true; // Set e-mail tab to active
        app.phase4 = false; // Set permission tab to inactive
        app.errorMsg = false; // Clear error message
    };

    // Function: Set the username pill to active
    app.usernamePhase = function() {
        $scope.nameTab = 'default'; // Clear name class
        $scope.usernameTab = 'active'; // Set username list to active
        $scope.emailTab = 'default'; // CLear e-mail class
        $scope.permissionsTab = 'default'; // CLear permissions tab
        app.phase1 = false; // Set name tab to inactive
        app.phase2 = true; // Set username tab to active
        app.phase3 = false; // Set e-mail tab to inactive
        app.phase4 = false; // Set permission tab to inactive
        app.errorMsg = false; // CLear error message
    };

    // Function: Set the permission pill to active
    app.permissionsPhase = function() {
        $scope.nameTab = 'default'; // Clear name class
        $scope.usernameTab = 'default'; // Clear username class
        $scope.emailTab = 'default'; // Clear e-mail class
        $scope.permissionsTab = 'active'; // Set permission list to active
        app.phase1 = false; // Set name tab to inactive
        app.phase2 = false; // Set username to inactive
        app.phase3 = false; // Set e-mail tab to inactive
        app.phase4 = true; // Set permission tab to active
        app.disableUser = false; // Disable buttons while processing
        app.disableModerator = false; // Disable buttons while processing
        app.disableAdmin = false; // Disable buttons while processing
        app.errorMsg = false; // Clear any error messages
        // Check which permission was set and disable that button
        if ($scope.newPermission === 'user') {
            app.disableUser = true; // Disable 'user' button
        } else if ($scope.newPermission === 'moderator') {
            app.disableModerator = true; // Disable 'moderator' button
        } else if ($scope.newPermission === 'admin') {
            app.disableAdmin = true; // Disable 'admin' button
        }
    };

    // Function: Update the user's name
    app.updateName = function(newName, valid) {
        app.errorMsg = false;
        app.disabled = true; 
        if (valid) {
            var userObject = {}; 
            userObject._id = app.currentUser; 
            userObject.name = $scope.newName; 
            User.editUser(userObject).then(function(data) {
                if (data.data.success) {
                    app.successMsg = data.data.message; 
                    $timeout(function() {
                        app.nameForm.name.$setPristine(); 
                        app.nameForm.name.$setUntouched(); 
                        app.successMsg = false; 
                        app.disabled = false; 
                    }, 2000);
                } else {
                    app.errorMsg = data.data.message; 
                    app.disabled = false; 
                }
            });
        } else {
            app.errorMsg = 'กรุณากรอกข้อมูลชื่อผู้ใช้'; 
            app.disabled = false; 
        }
    };

  
    app.updateEmail = function(newEmail, valid) {
        app.errorMsg = false; 
        app.disabled = true; 
  
        if (valid) {
            var userObject = {}; 
            userObject._id = app.currentUser; 
            userObject.email = $scope.newEmail; 

            User.editUser(userObject).then(function(data) {
               
                if (data.data.success) {
                    app.successMsg = data.data.message; 
                    $timeout(function() {
                        app.emailForm.email.$setPristine();
                        app.emailForm.email.$setUntouched(); 
                        app.successMsg = false; 
                        app.disabled = false; 
                    }, 2000);
                } else {
                    app.errorMsg = data.data.message; 
                    app.disabled = false; 
                }
            });
        } else {
            app.errorMsg = 'กรุณากรอกข้อมูลรอีเมลผู้ใช้'; 
            app.disabled = false; 
        }
    };

    app.updateUsername = function(newUsername, valid) {
        app.errorMsg = false; 
        app.disabled = true; 

        if (valid) {
            var userObject = {};
            userObject._id = app.currentUser; 
            userObject.username = $scope.newUsername; 
            User.editUser(userObject).then(function(data) {
               
                if (data.data.success) {
                    app.successMsg = data.data.message; 
                    $timeout(function() {
                        app.usernameForm.username.$setPristine(); 
                        app.usernameForm.username.$setUntouched(); 
                        app.successMsg = false; 
                        app.disabled = false; 
                    }, 2000);
                } else {
                    app.errorMsg = data.data.message; 
                    app.disabled = false; 
                }
            });
        } else {
            app.errorMsg = 'กรุณากรอกข้อมูลรหัสผู้ใช้'; 
            app.disabled = false;
        }
    };

    // Function: Update the user's permission
    app.updatePermissions = function(newPermission) {
        app.errorMsg = false; 
        app.disableUser = true; 
        app.disableAdmin = true; 
        var userObject = {}; 
        userObject._id = app.currentUser; 
        userObject.permission = newPermission; 
        User.editUser(userObject).then(function(data) {
            if (data.data.success) {
                app.successMsg = data.data.message; 
                $timeout(function() {
                    app.successMsg = false; 
                    $scope.newPermission = newPermission; 
                    if (newPermission === 'user') {
                        app.disableUser = true; 
                        app.disableAdmin = false; 
                    } else if (newPermission === 'admin') {
                        app.disableAdmin = true; 
                        app.disableUser = false; 
                    }
                }, 2000);
            } else {
                app.errorMsg = data.data.message; 
                app.disabled = false; 
            }
        });
    };
});