angular.module('diagramListController', ['authServices', 'diagramServices'])

.controller('diagramListCtrl', function(Auth, Diagram, $scope) {
    var app = this;
    app.limit = 8;
    app.dataDiagramList = [];
    this.getDiagram = function() {
        Auth.getUser().then(function(data) {

            Diagram.getDiagram(data.data.id).then(function(response) {
                if (response.data.length != 0) {
                    app.dataDiagramList = response.data;
                } else {
                    app.showList = true;
                    app.dataDiagramList = [];
                }
            })

        });
    };
    app.showListAll = false;
    this.getDiagramAll = function() {
        Diagram.getDiagramAll().then(function(response) {
            if (response.data.length != 0) {
                app.dataDiagramListAll = response.data;
            } else {
                app.showListAll = true;
                app.dataDiagramListAll = [];
            }
        })
    }
    this.getDiagramAll();

    this.delete = function(diagId) {
        Auth.getUser().then(function(data) {
            app.errorMsg = false;
            Diagram.delete(diagId, data.data.id).then(function(response) {
                // console.log(response)
                $('#modal_delete').modal('hide');
                if (response.data.success) {
                    app.successMsg = response.data.message;
                    app.errorMsg = false;
                    var index = app.dataDiagramList.findIndex(diagInfo => diagInfo._id == diagId);
                    app.dataDiagramList.splice(index, 1);
                } else {
                    app.errorMsg = response.data.message;
                    app.successMsg = false;
                }


                if (app.dataDiagramList.length === 0) {
                    app.showList = true;
                    app.dataDiagramList = null;
                }
            })
        });
    };

    this.orderByMe = function(x) {
        $scope.myOrderBy = x;
    }

    this.init = function() {
        $('#modal_delete').modal({
            backdrop: 'static',
            show: false
        });
    }
    this.init();
    this.getDiagram();

});