export class Logger {
    private context?: string;

    constructor(context?: string) {
        this.context = context;
    }

    public log(message: any, context?: string) {
        this.printMessage('log', message, context);
    }

    public error(message: any, trace?: string, context?: string) {
        this.printMessage('error', message, context, trace);
    }

    public warn(message: any, context?: string) {
        this.printMessage('warn', message, context);
    }

    public debug(message: any, context?: string) {
        this.printMessage('debug', message, context);
    }

    public verbose(message: any, context?: string) {
        this.printMessage('verbose', message, context);
    }

    private printMessage(level: 'log' | 'error' | 'warn' | 'debug' | 'verbose', message: any, context?: string, trace?: string) {
        const timestamp = new Date().toLocaleString();
        const ctx = context || this.context || 'Application';
        const pid = process.pid;
        
        const color = this.getColor(level);
        const reset = '\x1b[0m';
        const green = '\x1b[32m';
        const yellow = '\x1b[33m';
        
        const formattedMessage = typeof message === 'object' ? JSON.stringify(message, null, 2) : message;
        
        const output = `${green}[LeBot] ${pid}  -${reset} ${timestamp}   ${color}${level.toUpperCase()}${reset} ${yellow}[${ctx}]${reset} ${color}${formattedMessage}${reset}`;

        console.log(output);
        if (trace) {
            console.error(trace);
        }
    }

    private getColor(level: string): string {
        switch (level) {
            case 'log': return '\x1b[32m'; // Green
            case 'error': return '\x1b[31m'; // Red
            case 'warn': return '\x1b[33m'; // Yellow
            case 'debug': return '\x1b[35m'; // Magenta
            case 'verbose': return '\x1b[36m'; // Cyan
            default: return '\x1b[32m';
        }
    }
}
