import { Instance } from './instance';
import { getInstanceFromSchema, InstanceSchemaID } from './instanceschema';
import { Location } from './location';

export class Portal {
    public destination: Location | null = null;
    constructor(public location: Location, public destination_schema: InstanceSchemaID) {
    }
    public getReifiedDestination(): Location {
        this.reify();
        return this.destination!;
    }
    public reify() {
        if (this.destination && Instance.getLoadedInstanceById(this.destination.instance_id)) {
            return true;
        }
        const inst: Instance | null = getInstanceFromSchema(this.destination_schema);
        if (!inst) {
            console.log('Destination could not be reified.  Failed to construct instance of "' + this.destination_schema + '"');
            return false;
        }
        if (inst.portals.length) {
            this.destination = inst.portals[0].location;
            inst.portals[0].destination = this.location;
            return true;
        }
        console.log('Portal could not be reified, no portals exist in destination.');
        return false;
    }
}
