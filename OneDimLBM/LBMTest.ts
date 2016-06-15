/**
 * Created by marcus on 06/06/16.
 */
/// <reference path="../three.d.ts"/>

class Program {

}


class OneDimLBMGrid {
    private nodes : number;
    private densityGrid : Array<number>;

    public OneDimLBMGrid(nodes : number) {

    }
}

class GridNode {

    public density : Array<Array<number>>;
    public velocity : Array<Array<number>>;

    private static M : Array<Array<number>> = [[1,1], [-1,1]];

    public GridNode() {

    }


}

enum DIRECTION {
    WEST = 0,
    EAST = 1
}