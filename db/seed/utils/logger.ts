type LogLevel = 'silent' | 'normal' | 'verbose';

export class SeedLogger {
    private level: LogLevel;
    private startTime: number;

    constructor(level: LogLevel = 'normal') {
        this.level = level;
        this.startTime = Date.now();
    }

    info(message: string, verbose = false) {
        if (this.level === 'silent') return;
        if (verbose && this.level !== 'verbose') return;
        console.log(`[INFO] ${message}`);
    }

    success(message: string) {
        if (this.level === 'silent') return;
        console.log(`[SUCCESS] ${message}`);
    }

    error(message: string, error?: any) {
        console.error(`[ERROR] ${message}`, error || '');
    }

    warn(message: string) {
        if (this.level === 'silent') return;
        console.warn(`[WARN] ${message}`);
    }

    step(step: number, total: number, message: string) {
        if (this.level === 'silent') return;
        console.log(`[${step}/${total}] ${message}`);
    }

    summary(data: Record<string, any>) {
        if (this.level === 'silent') return;
        const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2);
        console.log('\n--- Seed Summary ---');
        Object.entries(data).forEach(([key, value]) => {
            console.log(`  ${key}: ${value}`);
        });
        console.log(`  Elapsed time: ${elapsed}s`);
        console.log('--------------------\n');
    }

    credentials(items: Array<{ label: string; value: string }>) {
        if (this.level === 'silent') return;
        console.log('\n--- Login Credentials ---');
        items.forEach(item => {
            console.log(`  ${item.label}: ${item.value}`);
        });
        console.log('-------------------------\n');
    }
}

