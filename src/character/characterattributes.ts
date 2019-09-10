export enum ATTRIBUTE {
    STRENGTH,
    ENDURANCE,
    VITALITY,
    AGILITY,
    DEXTERITY,
    SPEED,
    CHARISMA,
    LOGIC,
    WISDOM,
    MEMORY,
    WILLPOWER,
    LUCK,
}

const ATTRIBUTE_COUNT = 12;

export class CharacterAttributes {
    public static fromJSON(json: any) {
        const ret = new CharacterAttributes();
        for (let i = 0; i < ATTRIBUTE_COUNT; i++) {
            ret.values[i] = json[ATTRIBUTE[i]];
        }
        return ret;
    }

    private values: number[];
    constructor() {
        this.values = [];
        for (let i = 0; i < ATTRIBUTE_COUNT; i++) {
            this.values[i] = 0;
        }
    }
    public get(attr: ATTRIBUTE): number {
        return this.values[attr];
    }
    public set(attr: ATTRIBUTE, val: number) {
        this.values[attr] = val;
    }
    public getSumWith(other: CharacterAttributes): CharacterAttributes {
        const ret: CharacterAttributes = new CharacterAttributes();
        for (let i = 0; i < ATTRIBUTE_COUNT; i++) {
            ret.values[i] = this.values[i] + other.values[i];
        }
        return ret;
    }
    public clone() {
        const ret: CharacterAttributes = new CharacterAttributes();
        for (let i = 0; i < ATTRIBUTE_COUNT; i++) {
            ret.values[i] = this.values[i];
        }
        return ret;
    }
    public toJSON() {
        const ret = {};
        for (let i = 0; i < ATTRIBUTE_COUNT; i++) {
            ret[ATTRIBUTE[i]] = this.values[i];
        }
        return ret;
    }
}