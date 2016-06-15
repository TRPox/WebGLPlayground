/**
 * Created by marcus on 06/06/16.
 */
/// <reference path="../three.d.ts"/>
var Program = (function () {
    function Program() {
    }
    return Program;
}());
var OneDimLBMGrid = (function () {
    function OneDimLBMGrid() {
    }
    OneDimLBMGrid.prototype.OneDimLBMGrid = function (nodes) {
    };
    return OneDimLBMGrid;
}());
var GridNode = (function () {
    function GridNode() {
    }
    GridNode.prototype.GridNode = function () {
    };
    GridNode.M = [[1, 1], [-1, 1]];
    return GridNode;
}());
var DIRECTION;
(function (DIRECTION) {
    DIRECTION[DIRECTION["WEST"] = 0] = "WEST";
    DIRECTION[DIRECTION["EAST"] = 1] = "EAST";
})(DIRECTION || (DIRECTION = {}));
//# sourceMappingURL=LBMTest.js.map