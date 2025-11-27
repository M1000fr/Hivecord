export function DefaultCommand() {
    return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
        target.constructor.defaultCommand = propertyKey;
    };
}
