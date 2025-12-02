import { BaseCommand } from '@class/BaseCommand';
import { BaseEvent } from '@class/BaseEvent';

export interface ModuleOptions {
    name: string;
    commands?: (new () => BaseCommand)[];
    events?: (new () => BaseEvent<any>)[];
    interactions?: any[];
    config?: new () => any;
}
