import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
    test: {
        projects: [
            {
                test: {
                    name: 'node',
                    environment: 'node',
                    include: ['**/*.node.(test|spec).ts'],
                    exclude: ['node_modules'],
                },
            },
            {
                test: {
                    name: 'browser',
                    include: ['**/*.(test|spec).ts'],
                    exclude: ['node_modules', '**/*.node.(test|spec).ts'],
                    browser: {
                        provider: playwright(),
                        enabled: true,
                        headless: true,
                        screenshotFailures: false,
                        instances: [{ browser: 'chromium' }],
                    },
                },
            },
        ],
    },
})
