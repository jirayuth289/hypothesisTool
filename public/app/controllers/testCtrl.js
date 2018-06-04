angular.module('testController', ['diagramServices'])

.controller('testCtrl', function(Diagram, $routeParams, $timeout, $scope, $location) {
    var app = this;
    var network = null;
    var container = null;

    app.nodeDataList = [];
    app.diagramName = null;
    app.diagramId = null;
    // create an array with nodes
    var nodes = new vis.DataSet([]);

    // create an array with edges
    var edges = new vis.DataSet([]);
    app.data = {
        nodes: nodes,
        edges: edges
    };

    var getDiagram = function() {
        if (app.diagramId) {
            Diagram.getDiagramById(app.diagramId).then(function(response) {
                var tmpDiagram = response.data;
                app.diagramName = tmpDiagram.name;
                app.diagramId = tmpDiagram._id;
                var diag = JSON.parse(tmpDiagram.diagramDetail);
                // add nodes
                nodes.clear();
                edges.clear();
                var nodeInfo = diag.nodes._data;
                for (var key in nodeInfo) {
                    //set transparent color like background of the node
                    nodeInfo[key].font.color = 'transparent';
                    nodes.add(nodeInfo[key]);
                    app.nodeDataList.push(nodeInfo[key])
                }

                // add edges
                var edgeInfo = diag.edges._data;
                for (var key2 in edgeInfo) {
                    edges.add(edgeInfo[key2]);
                }
            });
            $timeout(function() {
                var options = {
                    offset: { x: 0, y: 0 },
                    duration: 200,
                    easingFunction: "easeInOutQuad"
                };
                network.fit({ animation: options });
            }, 100)
        }
    };

    var draw = function() {

        app.options = {
            height: '480px',
            width: '100%',
            nodes: {
                fixed: true
            },
        };
        network = new vis.Network(container, app.data, app.options);
    }

    var init = function() {
        //get param id diagram
        app.diagramId = $routeParams.id;

        container = document.getElementById('network');
        getDiagram();
        draw();
    }
    init()
        //convert object to array
    function objectToArray(obj) {
        return Object.keys(obj).map(function(key) {
            return obj[key];
        });
    }

    //drag and drop
    $scope.allowDrop = function(ev) {
        ev.preventDefault();
    };

    $scope.drag = function(ev) {
        ev.dataTransfer.setData("Text", ev.target.id);
    };

    $scope.drop = function(ev) {
        ev.preventDefault();
        var shape = ev.dataTransfer.getData("Text");

        var getNode = network.getNodeAt({ x: ev.offsetX, y: ev.offsetY })
        var id = nodes.get(getNode).id;
        if (shape === id) {
            var item = nodes.get(id).label;
            nodes.update({ id: id, font: { color: 'black' } });
            document.getElementById('popUpCheckCorrect').innerHTML = '<i class="material-icons" style="font-size:48px;color:green">check</i>';
            //delete list
            var index = app.nodeDataList.findIndex(nodes => nodes.id === id);
            app.nodeDataList.splice(index, 1);
            if (app.nodeDataList.length === 0) {
                $('#modal_success').modal('show');
            }
        } else {
            document.getElementById('popUpCheckCorrect').innerHTML = '<i class="material-icons" style="font-size:48px;color:red">close</i>';
        }
		    document.getElementById('popUpCheckCorrect').style.left = ev.clientX + "px";
            document.getElementById('popUpCheckCorrect').style.top = ev.clientY + "px";
            document.getElementById('popUpCheckCorrect').style.display = 'block';
            $timeout(function() {
                clearPopUpCkeckCorrect();
            }, 1000)
    };

    function clearPopUpCkeckCorrect() {
        document.getElementById('popUpCheckCorrect').style.display = 'none';
    }

    this.toPageList = function(path) {
        $location.path(path);
        $('#modal_success').modal('hide');
    };

    this.toNextTest = function() {
		app.msgTest = '';
        Diagram.toGetDiagramTest(app.diagramId).then(function(response) {
			if(response.data.success) {
			$('#modal_success').modal('hide');
            app.diagramId = response.data.diagram;
            getDiagram();
			} else {
				app.msgTest = response.data.message;
			}
          
        })
    }
})