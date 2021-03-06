import * as t from 'io-ts';

const MAX_CONTROL_SETS = 5;

const control_set_schema = t.type({
    'name': t.string,
    'keys': t.record(t.string, t.array(t.string)),
});

type ControlSet = t.TypeOf<typeof control_set_schema>;

const controls_schema = t.type({
    'current': t.string,
    'sets': t.array(control_set_schema),
});

type Controls = t.TypeOf<typeof controls_schema>;

const graphics_schema = t.type({
    'ascii': t.boolean,
});

type Graphics = t.TypeOf<typeof graphics_schema>;

export type UserSettingsSchema = t.TypeOf<typeof UserSettings.schema>;

export class UserSettings {
    public static schema = t.type({
        'controls': controls_schema,
        'graphics': graphics_schema,
    });
    public static createFreshWithDefaults() {
        return new UserSettings(
            {
                'current': 'default',
                'sets': [],
            },
            {
                'ascii': false,
            },
        );
    }
    public static fromJSON(json: UserSettingsSchema) {
        return new UserSettings(json.controls, json.graphics);
    }

    constructor(public controls: Controls, public graphics: Graphics) { }
    private convertToBoolean(value: unknown): boolean | undefined {
        if (value === 'true') {
            return true;
        }
        if (value === 'false') {
            return false;
        }
        if (typeof value === 'boolean') {
            return value;
        }
    }
    public setSetting(section: string, setting: string, value: unknown): string | undefined {
        if (section === 'graphics') {
            if (setting === 'ascii') {
                const bval = this.convertToBoolean(value);
                if (bval !== undefined) {
                    this.graphics.ascii = bval;
                    return;
                }
                return 'Invalid value for setting: graphics.ascii is of type boolean.';
            }
            return 'No such graphics setting: ' + setting;
        }
        return 'No such setting section: ' + section;

    }
    public createControlSet(name: string): string {
        if (this.controls.sets.length >= MAX_CONTROL_SETS) {
            return 'Maximum number of control sets reached.'
        }
        this.controls.sets.push({
            name,
            'keys': {},
        });
        return 'Control set created.'
    }
    public toJSON(): UserSettingsSchema {
        return {
            'controls': this.controls,
            'graphics': this.graphics,
        }
    }
}
