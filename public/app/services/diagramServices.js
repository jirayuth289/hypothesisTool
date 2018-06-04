angular.module('diagramServices', [])

.factory('Diagram', function($http) {
    var diagramFactory = {};
    //create diagram
    diagramFactory.create = function(diagData) {
        return $http.post('/api/creatrDiag', diagData); // Return data from end point to controller
    };

    //get diagram by id
    diagramFactory.getDiagramById = function(id) {
        return $http.get('/api/getDiag/' + id); // Return data from end point to controller
    };

    // diagram data update
    diagramFactory.update = function(diagData) {
        return $http({
            method: 'PUT',
            url: '/api/updateDiag',
            data: diagData,
        })
    };
    //diagram List
    diagramFactory.getDiagram = function(uersID) {
        return $http.get('/api/getDiagName/' + uersID);
    };
    //test digram list 
    diagramFactory.getDiagramAll = function() {
        return $http.get('/api/getDiagram');
    };

    diagramFactory.delete = function(diagId, userId) {
        return $http({
            method: 'DELETE',
            url: '/api/delete',
            params: { diagId: diagId, userId: userId }
        });
    }

    // to next test diagram
    diagramFactory.toGetDiagramTest = function(diagramId) {
        return $http.get('/api/toGetDiagramTest/' + diagramId);
    };
    return diagramFactory;
});