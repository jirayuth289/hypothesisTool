angular.module('diagramControllers', ['authServices', 'diagramServices'])

.controller('diagramCtrl', function($document, Auth, $timeout, $location, $rootScope, $window, $scope, Diagram, $routeParams, $route) {
    var app = this;
    var network = null;
    var container = null;

    // create an array with nodes
    var nodes = new vis.DataSet([]);

    // create an array with edges
    var edges = new vis.DataSet([]);
    app.dataDiagram = {
        nodes: nodes,
        edges: edges
    };

    var languageNetwork = {
        en: {
            edit: 'แก้ไข',
            del: 'ลบที่เลือก',
            back: 'กลับ',
            addNode: 'เพิ่มตัวแปร',
            addEdge: 'เพิ่มเส้นเชื่อม',
            editNode: 'แก้ไขตัวแปร',
            editEdge: 'แก้ไขเส้นเชื่อม',
            addDescription: 'เลือกพื้นที่ว่างเพื่อสร้างตัวแปร',
            edgeDescription: 'เลือกตัวแปรแล้วลากเส้นเชื่อมไปยังตัวแปรอื่น ๆ ที่ต้องการเชื่อมโยง'
        }
    }

    this.destroy = function() {
        if (network !== null) {
            network.destroy();
            network = null;
        }
    }

    this.draw = function() {
        this.destroy();

        app.options = {
            height: '580px',
            width: '100%',
            locales: languageNetwork,
            manipulation: {
                initiallyActive: true,
                addNode: false,
                editNode: function(data, callback) {
                    // filling in the popup DOM elements
                    var nodeItem = nodes.get(app.selNodeId);
                    app.lbl_operation = 'แก้ไขตัวแปร';
                    $scope.$apply();
                    document.getElementById('label').value = nodeItem.label;
                    if (nodeItem.variable === 'InDeVar')
                            document.getElementById('InDeVar').checked = true;
                    else
                        document.getElementById('CtrlVar').checked = true;

                    var coordinate = network.canvasToDOM({ x: nodeItem.x, y: nodeItem.y });
                    document.getElementById('saveNode').onclick = saveNodeData.bind(this, nodeItem, callback);
                    document.getElementById('cancelNode').onclick = cancelEditNode.bind(this, callback);
                    document.getElementById('addNode').style.left = coordinate.x + "px";
                    document.getElementById('addNode').style.top = coordinate.y + "px";
                    document.getElementById('addNode').style.display = 'block';
                },
                addEdge: function(data, callback) {
                    app.lblEdge = 'เพิ่มเส้นเชื่อม';
                    $scope.$apply();
                    data.arrows = 'to';
                    if (data.from == data.to) {
                        if (r) {
                            callback(null);
                            return;
                        }
                    }

                    editEdgeWithoutDrag(data, callback);
                },
                editEdge: {
                    editWithoutDrag: function(data, callback) {
                        app.lblEdge = "แก้ไขเส้นเชื่อม";
                        $scope.$apply();

                        editEdgeWithoutDrag(data, callback);
                    }
                }
            },
            physics: {
                enabled: true,
                timestep: 0.5,
                adaptiveTimestep: true
            },
            nodes: {
                shape: 'ellipse',
                scaling: {
                    customScalingFunction: function(min, max, total, value) {
                        return value / total;
                    },
                    min: 5,
                    max: 150
                },
                mass: 0,
                margin: 10,
            },
            edges: {
                smooth: {
                    type: "continuous",
                    forceDirection: "none",
                    roundness: 0.04
                },
                arrows: {
                    to: true
                },
                chosen: {
                    label: false,
                    edge: changeChosenEdgeToArrowScale
                }
            },
            interaction: {
                navigationButtons: true,
                keyboard: false,
                hover: true
            }
        };
        network = new vis.Network(container, app.dataDiagram, app.options);
    }

    app.inputIndepAnddepVar = ['indepAnddepVar1'];
    this.addIndepAnddepVar = function(ev, index) {
        if (ev.which === 13) {
            var num = 2;
            var element = angular.element($document[0].querySelector("#input"));
            element.bind('keyup', function(e) {
                if (e.which === 13) {
                    element.append('<input type="text" id="indepAnddepVar' + num + '">');
                    $('#indepAnddepVar' + num).focus();
                    app.inputIndepAnddepVar.push('indepAnddepVar' + num);
                    num++;
                }
            });

        }
    }

    app.inputControlVar = ['controlVar1'];
    this.addControlVar = function (ev, index){
        if (ev.which === 13) {
            var num = 2;
            var element = angular.element($document[0].querySelector("#input2"));
            element.bind('keyup', function(e) {
                if (e.which === 13) {
                    element.append('<input type="text" id="controlVar' + num + '">');
                    $('#controlVar' + num).focus();
                    app.inputControlVar.push('controlVar' + num);
                    num++;
                }
            });

        }
    }

    function saveNodeData(data, callback) {
        var label = document.getElementById('label').value;
        var controlVar = document.getElementById('CtrlVar').checked;
        if (label !== "") {
            var shape = 'ellipse';
            var type = 'InDeVar';
            if (controlVar) {
                shape = 'box';
                type = 'CtrlVar';
            }

            data.label = label;
            data.variable = type;
            data.shape = shape;
            app.msgErr = {
                label: false
            }
            $scope.$apply();

            clearPopUpAddNode();
            callback(data);
        } else {
            if (app.nameNode === '')
                app.msgErr.label = true;
            else
                app.msgErr.label = false;

            $scope.$apply();
            callback(null);
        }
    }

    function cancelEditNode(callback) {
        // clearPopUp();
        clearPopUpAddNode();
        callback(null);
    }

    function editEdgeWithoutDrag(data, callback) {
        var checkconn = false;
        var nodeItem = null;
        //check controller variable to independent and dependent varible
        var tmpnodes = objectToArray(nodes._data);
        tmpnodes.forEach(function(elem) {
            if (data.from == elem.id && elem.variable == "InDeVar") {
                if (tmpnodes.find(node => node.id == data.to && node.variable == "CtrlVar")) {
                    var independ = tmpnodes.find(node => node.id == data.to && node.variable == "CtrlVar");

                    nodeItem = nodes.get(data.to);
                    checkconn = true;
                }
            }
        });
        //check controller variable to controller variable
        tmpnodes.forEach(function(elem) {
            if (data.from == elem.id && elem.variable == "CtrlVar") {
                if (tmpnodes.find(node => node.id == data.to && node.variable == "CtrlVar")) {
                    var independ = tmpnodes.find(node => node.id == data.to && node.variable == "CtrlVar");

                    nodeItem = nodes.get(data.to);
                    checkconn = true;
                }
            }
        });

        if (checkconn) {
            document.getElementById('lbl-msg').innerHTML = 'การเชื่อมโยงระหว่างตัวแปรไม่ถูกต้อง กรุณาตรวจสอบความถูกต้องของตัวแปร';
            var coordinate = network.canvasToDOM({ x: nodeItem.x, y: nodeItem.y });
            document.getElementById('error-msg').style.left = coordinate.x + "px";
            document.getElementById('error-msg').style.top = coordinate.y + "px";
            document.getElementById('error-msg').style.display = 'block';
            document.getElementById('ok-errorButton').style.display = 'none';
            callback(null);
        } else {
            var nodeItemTo = nodes.get(data.to);
            var nodeItemFrom = nodes.get(data.from);
            if (nodeItemFrom.variable === 'CtrlVar' && nodeItemTo.variable === 'InDeVar') {
                saveEdgeData(data, callback);
            } else {
                var coordinate = network.canvasToDOM({ x: nodeItemTo.x, y: nodeItemTo.y });
                document.getElementById('edge-saveButton').onclick = saveEdgeData.bind(this, data, callback);
                document.getElementById('edge-cancelButton').onclick = cancelEdgeEdit.bind(this, callback);
                document.getElementById('edge-popUp').style.left = coordinate.x + "px";
                document.getElementById('edge-popUp').style.top = coordinate.y + "px";
                document.getElementById('edge-popUp').style.display = 'block';
            }
        }
    }

    function saveEdgeData(data, callback) {
        if (typeof data.to === 'object')
            data.to = data.to.id;
        if (typeof data.from === 'object')
            data.from = data.from.id;
        //chk arrow line or dashes
        var arrows = document.getElementById('edges').value;
        if (arrows != 'line')
            data.dashes = true;
        else
            data.dashes = false;
        //set color of the edge
        data.color = { color: '#343434' }
            //set width of the edge
        data.width = 1;
        document.getElementById('edges').value = 'line';
        clearEdgePopUp();
        callback(data);
    }

    this.closePopupErr = function() {
        document.getElementById('error-msg').style.display = 'none';
    }

    function clearEdgePopUp() {
        document.getElementById('edge-saveButton').onclick = null;
        document.getElementById('edge-cancelButton').onclick = null;
        document.getElementById('edge-popUp').style.display = 'none';
    }

    function cancelEdgeEdit(callback) {
        clearEdgePopUp();
        callback(null);
    }

    //chosen arrowshead
    var changeChosenEdgeToArrowScale = function(values, id, selected, hovering) {
        values.toArrowScale = 2;
    }

    this.clearNetwork = function() {
        nodes.clear();
        edges.clear();
    }

    this.chkCtrlVarBeforeSave = function() {
        var tmpNodes = objectToArray(nodes._data);
        if (tmpNodes.find(tmpNode => tmpNode.variable == 'CtrlVar')) {
            this.exportDiagram();
        } else {
            $('#modal_addVarCtrl').modal({
                backdrop: 'static',
                show: true
            });
        }
    }

    this.exportDiagram = function() {
        $('#modal_addVarCtrl').modal('hide');
        //update position node
        nodes.forEach(function(elem, index, array) {
            var positions = network.getPositions(index);
            nodes.update({ id: index, x: positions[index].x, y: positions[index].y })
        })
        var diagramDetail = JSON.stringify(app.dataDiagram, undefined, 2);

        Auth.getUser().then(function(data) {
            app.errorMsg = false;

            if (!app.diagramId) {
                //create diagram
                var diagCreate = {
                    name: app.name,
                    diagramDetail: diagramDetail,
                    userID: data.data.id,
                }

                Diagram.create(diagCreate).then(function(data) {
                    if (data.data.success) {
                        app.diagramId = data.data.id;
                        app.successMsg = data.data.message;
                        app.errorMsg = false;
                    } else {
                        app.errorMsg = data.data.message;
                        app.successMsg = false;
                    }
                });
            } else {
                //update diagram
                var diagUpdate = {
                    name: app.name,
                    diagramDetail: diagramDetail,
                    id: app.diagramId
                }

                Diagram.update(diagUpdate).then(function(response) {
                    console.log(response)
                    if (response.data.success) {
                        app.successMsg = response.data.message;
                        app.errorMsg = false;
                    } else {
                        app.errorMsg = response.data.message;
                        app.successMsg = false;
                    }
                });
            }
        });
    }

    this.getDiagram = function() {
        if (app.diagramId) {
            Diagram.getDiagramById(app.diagramId).then(function(response) {
                app.diagInfo = response.data;
                app.name = app.diagInfo.name;
                var diag = JSON.parse(app.diagInfo.diagramDetail);
                // add nodes
                var nodeInfo = diag.nodes._data;
                for (var key in nodeInfo) {
                    nodes.add(nodeInfo[key]);
                }
                // add edges
                var edgeInfo = diag.edges._data;
                for (var key2 in edgeInfo) {
                    edges.add(edgeInfo[key2]);
                }
            });
        }
        //fit diagram
        $timeout(function() {
            var options = {
                offset: { x: 0, y: 0 },
                duration: 200,
                easingFunction: "easeInOutQuad"
            };
            network.fit({ animation: options });
        }, 100)
    }

    //show popUp select direction
    this.defineDirectToIndependVar = function() {
        app.IndependVarList = findIndependVar();

        $('#modal_hypSearch').modal({
            backdrop: 'static',
            show: true
        });
    };

    //hypothesis search
    this.hypSearch = function() {
        //hypothesis data variable 
        app.dataHyp = [];
        //hide modal set direct independent varialble
        $('#modal_hypSearch').modal('hide');
        document.getElementById('paddingToHyp').style.padding = "20px";
        //scroll to results hypothesis
        $('html, body').animate({
            scrollTop: $("#paddingToHyp").offset().top
        }, 1000);
        //get connected to the node
        setConnectedToObjNode();
        //set direct to the independent variable node
        findIndependVar().forEach(function(elem, index, array) {
            app.IndependVarList.forEach(function(independ) {
                if (elem.id === independ.id && independ.direct) {
                    elem.direct = independ.direct;
                    //DFS to the node
                    DFSUtil(elem);
                }
            })
        });
        //set direct to the all node
        setDirectionToAllNode();
        checkDuplicateHyp();
        setEdgesToHyp();
    };


    app.count = 1;

    function DFSUtil(s) {
        var BreakException = {};
        app.tmpNodes = nodes._data;

        for (var key in app.tmpNodes) {
            app.tmpNodes[key].colors = 'white';
        }
        var Stack = [];
        app.tmpNodes[s.id].colors = 'gray';
        Stack.push(s);

        while (!Stack.length == 0) {
            var f = Stack[Stack.length - 1];
            var v = null;
            try {
                app.tmpNodes[f.id].connections.forEach(function(elem, index, array) {
                    if (app.tmpNodes[elem].colors == 'white') {
                        v = app.tmpNodes[elem].id;
                        throw BreakException;
                    }
                });

            } catch (e) {
                if (e !== BreakException) throw e;
            }

            if (v != null) {
                app.tmpNodes[v].colors = 'gray';
                Stack.push(app.tmpNodes[v]);

                var tmp = [];
                Stack.forEach(function(elem) {
                    tmp.push(elem);
                });

                //duplicate hyp check
                var count = 0;
                var chkDupli = false;
                app.dataHyp.forEach(function(elem) {
                    if (elem.data.length == tmp.length) {
                        elem.data.forEach(function(data, index, array) {
                            if (tmp[index].id == data.id)
                                count++;
                        })
                    }
                    if (count == elem.data.length)
                        chkDupli = true;
                    count = 0;
                })

                if (!chkDupli) {
                    app.dataHyp.push({ g: app.count, data: tmp });
                    app.count++;
                }
                //verify when visite to node last node that visited
                var tmp2 = []
                app.dataHyp.forEach(function(elem) {
                    elem.data.forEach(function(node, index, array) {
                        if (elem.g == app.count - 1) {
                            if (elem.data.length == index + 1) {
                                if (node.connections.length != 0) {
                                    var nodeEnd = nodes.get(node.connections[0]);
                                    if (nodeEnd.connections.length == 0) {
                                        tmp2 = [];
                                        elem.data.forEach(function(data) {
                                            tmp2.push(data);
                                        })

                                        tmp2.push(nodeEnd)
                                        app.dataHyp.push({ g: app.count++, data: tmp2 });
                                    }
                                }
                            }
                        }
                    })
                })

            } else {
                var p = Stack.pop();
                app.tmpNodes[f.id].colors = 'black';
            }
        }
    };

    function setConnectedToObjNode() {
        //add link to the nodes
        var tmpNode = objectToArray(nodes._data);
        var tmpedges = objectToArray(edges._data);
        tmpNode.forEach(function(elemnode, indexnode, arraynode) {
            var connect = network.getConnectedNodes(elemnode.id);

            var nodeTo = []
            connect.forEach(function(elemconn, index, array) {
                tmpedges.forEach(function(elem2, index2, array2) {
                    if (elemconn === elem2.from) {
                        if (elem2.to == elemnode.id)
                            nodeTo.push(elem2.from);
                    }
                });
            });

            nodeTo.forEach(function(elem, index, array) {
                connect.forEach(function(elem2, index2, array2) {
                    if (elem === elem2)
                        connect.splice(index2, 1);
                });
            });

            nodes.update({ id: elemnode.id, connections: connect });
        });
    }

    function findIndependVar() {
        var nodeIndepend = [];
        var tmpNodes = objectToArray(nodes._data);
        var tmp = tmpNodes.filter(tmpNode => tmpNode.variable == 'InDeVar');
        //control variable
        var tmpVarC = tmpNodes.filter(tmpNode => tmpNode.variable == 'CtrlVar');

        tmp.forEach(function(node, index, array) {
            var cc = 0;
            var tmp2 = network.getConnectedEdges(node.id)
            tmp2.forEach(function(edge) {
                var item = edges.get(edge);
                if (!tmpVarC.find(c => c.id == item.from)) {
                    if (item.to == node.id)
                        cc++;
                }
            })
            if (cc === 0)
                nodeIndepend.push(node);
        })

        return nodeIndepend;
    }

    function setDirectionToAllNode() {
        var tmpedge = [];
        app.dataHyp.forEach(function(elem, position) {
            tmpedge = [];
            // new object
            elem.mydata = [];
            elem.mydata[0] = { borderWidth: elem.data[0].borderWidth, color: elem.data[0].color, direct: elem.data[0].direct, font: elem.data[0].font, id: elem.data[0].id, label: elem.data[0].label, shape: elem.data[0].shape, x: elem.data[0].x, y: elem.data[0].y };

            elem.data.forEach(function(data, index, array) {
                var connect = network.getConnectedEdges(data.id);
                var length = elem.data.length;

                if (tmpedge.length < length - 1) {
                    connect.forEach(function(edge) {
                        var e = edges.get(edge);
                        if (data.id == e.from && array[index + 1].id == e.to) {
                            tmpedge.push(e);
                            // new object
                            var aNode = { borderWidth: elem.data[index + 1].borderWidth, color: elem.data[index + 1].color, direct: undefined, font: elem.data[index + 1].font, id: elem.data[index + 1].id, label: elem.data[index + 1].label, shape: elem.data[index + 1].shape, x: elem.data[index + 1].x, y: elem.data[index + 1].y };

                            if (elem.mydata[index].direct == 'up' && !e.dashes) {
                                aNode.direct = 'up';
                                elem.mydata[index + 1] = aNode;
                            } else if (elem.mydata[index].direct == 'up' && e.dashes) {
                                aNode.direct = 'down';
                                elem.mydata[index + 1] = aNode;
                            } else if (elem.mydata[index].direct == 'down' && !e.dashes) {
                                aNode.direct = 'down';
                                elem.mydata[index + 1] = aNode;
                            } else {
                                aNode.direct = 'up';
                                elem.mydata[index + 1] = aNode;
                            }
                        }
                    });
                }
            });
        });
    }

    function checkDuplicateHyp() {
        //separate hyp
        var size = app.dataHyp.length;
        app.dataHyp.forEach(function(elem, index, array) {
            if (elem.mydata.length > 2) {

                var tmp = [];
                elem.mydata.forEach(function(data) {
                    tmp.push(data);
                })
                while (tmp.length > 2) {
                    var s = tmp.shift();

                    var tmp2 = [];
                    tmp.forEach(function(elem) {
                        tmp2.push(elem);
                    });

                    var count = 0;
                    var chkDupli = false;
                    app.dataHyp.forEach(function(elem) {
                        if (elem.mydata.length === tmp2.length) {
                            elem.mydata.forEach(function(data, index2, array) {
                                if (tmp2[index2].id === data.id && tmp2[index2].direct === data.direct)
                                    count++;
                            });
                        }
                        if (count === elem.mydata.length)
                            chkDupli = true;
                        count = 0;
                    })

                    if (!chkDupli)
                        app.dataHyp.push({ g: size++, mydata: tmp2 });
                }
            }
        });
    }

    function setEdgesToHyp() {
        var tmpedge = [];
        app.dataHyp.forEach(function(node) {
            tmpedge = [];
            node.mydata.forEach(function(data, index) {
                var connect = network.getConnectedEdges(data.id);
                var length = node.mydata.length;
                connect.forEach(function(edge) {
                    var e = edges.get(edge);
                    if (tmpedge.length < length - 1) {
                        if (data.id == e.from && node.mydata[index + 1].id == e.to)
                            tmpedge.push(e);
                    }
                });
            });
            node.edge = tmpedge;
        });
    }

    this.init = function() {
        // create a network
        container = document.getElementById('network');

        app.isFullScreen = false;
        app.msgErr = {
            label: false
        };

        $('#modal_addVarCtrl').modal({
            backdrop: 'static',
            show: false
        });
        //get param id diagram
        app.diagramId = $routeParams.id;
        // selected node
        app.selNodeId = null;
        //selected edge
        app.selEdgeId = null;

        //get diagram from page list
        if (app.diagramId)
            this.getDiagram();

        this.draw();
    };
    // call init function 
    this.init();

    this.viewHypByGroup = function(data) {
        var nodesByGroup = new vis.DataSet([]);
        var edgesByGroup = new vis.DataSet([]);

        app.dataHypByGroup = {
            nodes: nodesByGroup,
            edges: edgesByGroup
        };
        app.optionsHypByGroup = {
            height: '350px',
            width: '100%',
            nodes: {
                fixed: true
            },
            interaction: {
                keyboard: false,
                hover: true
            }
        };
        data.mydata.forEach(function(node) {
            //new node to create every time when press button
            var newNode = { borderWidth: node.borderWidth, color: node.color, direct: node.direct, font: node.font, id: node.id, label: node.label, shape: node.shape, x: node.x, y: node.y }
            var hex = '';
            if (newNode.direct == 'up')
                hex = '2191'
            else
                hex = '2193'
            var char = unescape('%u' + hex);
            newNode.label = newNode.label + ' ' + char;
            nodesByGroup.add(newNode)
        })

        data.edge.forEach(function(edge) {
            edgesByGroup.add(edge)
        })

        app.hypGroup = data.g;
        var containerHypByGroup = document.getElementById('viewHypByGroup');
        var networkHypByGroup = new vis.Network(containerHypByGroup, app.dataHypByGroup, app.optionsHypByGroup);
        $('#modal_viewHyp').modal({
            backdrop: 'static',
            show: true
        });
    };

    //action to selected the node
    network.on("selectNode", function(params) {
        app.selEdgeId = false;
        //font defualt
        app.font = 14;
        params.event = "[original event]";
        app.selNodeId = params.nodes[0];
        //set font size
        var item = nodes.get(app.selNodeId);
        //set font size
        app.font_size.selectedOption = item.font.size;
        //set font color
        if (item.font.color === "#ffffff" || item.font.color === "white")
            document.getElementById('btn_font_color').style.color = "#343434";
        else
            document.getElementById('btn_font_color').style.color = item.font.color;
        //set backgroud color
        if (item.color.background === "#ffffff" || item.color.background === "white")
            document.getElementById('btn_bg_color').style.color = "#343434";
        else
            document.getElementById('btn_bg_color').style.color = item.color.background;
        //border width of node
        app.border_widths.selectedOption = item.borderWidth;
    });

    app.font_size = {
        options: [14, 16, 18, 20, 22, 24, 26, 28, 36, 48, 72],
        selectedOption: 14
    };
    this.sizeFont = function(act) {
        // get a specific item
        var item = nodes.get(app.selNodeId);
        app.font = item.font.size;
        if (act === 'add')
            app.font++;
        else if (act === 'sub')
            app.font--;
        else
            app.font = app.font_size.selectedOption;

        nodes.update({
            id: app.selNodeId,
            font: { size: app.font, color: item.font.color }
        });
    };
    //font color of node
    this.colorFont_node = function(color) {
        var item = nodes.get(app.selNodeId);
        nodes.update({
            id: app.selNodeId,
            font: { color: color, size: item.font.size }
        });
    };
    //background color of node
    this.bg_node = function(color) {
        var item = nodes.get(app.selNodeId);
        nodes.update({
            id: app.selNodeId,
            color: { background: color, border: item.color.border }
        });
    };
    //border color of node
    this.border_node = function(color) {
        var item = nodes.get(app.selNodeId);
        nodes.update({
            id: app.selNodeId,
            color: { border: color, background: item.color.background }
        });
    };
    //border width of node
    app.border_widths = {
        options: [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14],
        selectedOption: 1
    };
    this.border_width = function() {
        var item = nodes.get(app.selNodeId);
        nodes.update({
            id: app.selNodeId,
            borderWidth: app.border_widths.selectedOption
        });
    };
    //select edge
    network.on("selectEdge", function(params) {
        app.selNodeId = false;
        app.selEdgeId = params.edges[0];
        var item = edges.get(app.selEdgeId);

        if (item.color)
            app.edge_color = item.color.color;
        app.width_edge.selectedOption = item.width;
    });

    //color of the edge
    this.edges_color = function(color) {
        edges.update({
            id: app.selEdgeId,
            color: { color: color }
        });
    };
    //width of the egdes
    app.width_edge = {
        options: [1, 2, 3, 4, 5, 6, 7, 8, 10, 12, 14],
        selectedOption: 1
    };
    this.width_edges = function() {
        edges.update({
            id: app.selEdgeId,
            width: app.width_edge.selectedOption
        });
    };
    //duble click to edit node and edge
    network.on("doubleClick", function(params) {
        params.event = "[original event]";
        app.selNodeId = params.nodes[0];
        if (params.nodes.length !== 0)
            network.editNode();
        else
            network.editEdgeMode();
    });
    // add node
    app.addNode = function (input) {
        if (input === 'indepAnddepVar') {
            app.inputIndepAnddepVar.forEach((lable, index) => {
                var tmp = $('#indepAnddepVar' + (index + 1)).val();
                if (tmp !== "") {
                    nodes.add({
                        label: tmp,
                        shape: 'ellipse',
                        variable: 'InDeVar',
                        borderWidth: 1,
                        color: {
                            border: '#ccc',
                            background: 'white'
                        },
                        font: {
                            color: '#343434',
                            size: 14,
                        },
                        x: Math.floor(Math.random() * 700) + 200,
                        y: Math.floor(Math.random() * 240) + 150
                    });
                }
            })
        } else {
            app.inputControlVar.forEach((lable, index) => {
                var tmp = $('#controlVar' + (index + 1)).val();
                if (tmp !== "") {
                    nodes.add({
                        label: tmp,
                        shape: 'box',
                        variable: 'CtrlVar',
                        borderWidth: 1,
                        color: {
                            border: '#ccc',
                            background: 'white'
                        },
                        font: {
                            color: '#343434',
                            size: 14,
                        },
                        x: Math.floor(Math.random() * 700) + 200,
                        y: Math.floor(Math.random() * 240) + 150
                    });
                }
            })
        }


    }
        //clear popup add node
    function clearPopUpAddNode() {
        document.getElementById('addNode').onclick = null;
        document.getElementById('cancelNode').onclick = null;
        document.getElementById('addNode').style.display = 'none';
    }
    //convert object to array
    function objectToArray(obj) {
        return Object.keys(obj).map(function(key) {
            return obj[key];
        });
    }
    //update positions the node
    network.on("dragging", function(params) {
        nodes.forEach(function(elem, index, array) {
            var positions = network.getPositions(index);
            nodes.update({ id: index, x: positions[index].x, y: positions[index].y });
        });
    });

    var tmpDataTranfer = null;
    var actionDataTranfer = 'copy';
    $scope.stateNodeCopy = function() {
        var item = nodes.get(app.selNodeId);
        console.log(app.selNodeId)
        tmpDataTranfer = item;
        actionDataTranfer = 'copy';
    };
    $scope.stateNodeCut = function() {
        var item = nodes.get(app.selNodeId);
        tmpDataTranfer = item;
        nodes.remove(item.id);
        actionDataTranfer = 'cut';
    };
    $scope.stateNodePaste = function() {
        var tmp = { borderWidth: tmpDataTranfer.borderWidth, color: tmpDataTranfer.color, font: tmpDataTranfer.font, label: tmpDataTranfer.label, shape: tmpDataTranfer.shape, variable: tmpDataTranfer.variable, x: tmpDataTranfer.x + 15, y: tmpDataTranfer.y + 15 };
        if (actionDataTranfer === 'copy') {
            tmp.x = tmpDataTranfer.x + 15;
            tmp.y = tmpDataTranfer.y + 15
            nodes.add(tmp);
        } else {
            tmp.id = tmpDataTranfer.id;
            try {
                nodes.add(tmp);
            } catch (err) {
                throw err;
            }

        }

    };
    //delete the node by click delete button
    $('html').keyup(function(e) {
        if (e.keyCode == 46) {
            if (app.selNodeId)
                nodes.remove({ id: app.selNodeId });
            if (app.selEdgeId)
                edges.remove({ id: app.selEdgeId });
        } else if (e.which === 89 && e.ctrlKey)
            $scope.stateRedo();
        else if (e.which === 90 && e.ctrlKey)
            $scope.stateUndo();
        else if (e.which === 67 && e.ctrlKey)
            $scope.stateNodeCopy();
        else if (e.which === 86 && e.ctrlKey)
            $scope.stateNodePaste();
        else if (e.which === 88 && e.ctrlKey)
            $scope.stateNodeCut();
    });

    $scope.scrollToTop = function() {
        $('html, body').animate({
            scrollTop: $("#name").offset().top
        }, 1000);
    }
});