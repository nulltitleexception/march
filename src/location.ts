export class Location {
    public static fromJSON(json: any) {
        return new Location(json.x, json.y, json.instance_id);
    }
    constructor(private _x: number, private _y: number, private _instance_id: string) {
    }
    get x(): number {
        return this._x;
    }
    get y(): number {
        return this._y;
    }
    get instance_id(): string {
        return this._instance_id;
    }
    public getMovedBy(dx: number, dy: number) {
        return new Location(this._x + dx, this._y + dy, this._instance_id);
    }
    public clone() {
        return new Location(this._x, this._y, this._instance_id);
    }
    public toJSON() {
        return {
            'x': this.x,
            'y': this.y,
            'instance_id': this.instance_id,
        };
    }
}
