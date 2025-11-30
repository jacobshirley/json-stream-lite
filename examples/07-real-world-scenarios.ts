/**
 * Real-World Scenarios Example
 *
 * This example demonstrates practical use cases for json-stream-lite
 * in real-world applications.
 */

import { JsonObject, JsonArray, jsonKeyValueParser } from 'json-stream-lite'

function stringToBytes(str: string): number[] {
    return Array.from(new TextEncoder().encode(str))
}

// Scenario 1: Processing a configuration file
console.log('=== Scenario 1: Configuration File Processing ===')
function processConfig() {
    const configJson = JSON.stringify({
        database: {
            host: 'localhost',
            port: 5432,
            pool: { min: 2, max: 10 },
        },
        api: {
            port: 8080,
            timeout: 30000,
        },
        features: {
            analytics: true,
            debugging: false,
        },
    })

    console.log('Extracting all configuration values:')
    const config: Record<string, any> = {}

    for (const [key, value] of jsonKeyValueParser(configJson)) {
        config[key] = value
    }

    // Access nested values easily
    console.log('  Database host:', config['database.host'])
    console.log('  Database pool max:', config['database.pool.max'])
    console.log('  API port:', config['api.port'])
    console.log('  Analytics enabled:', config['features.analytics'])
}

processConfig()

// Scenario 2: Log file analysis
console.log('\n=== Scenario 2: Log File Analysis ===')
function analyzeLogEntries() {
    const logEntries = JSON.stringify({
        logs: [
            {
                timestamp: '2025-11-30T10:00:00Z',
                level: 'ERROR',
                message: 'Connection failed',
            },
            {
                timestamp: '2025-11-30T10:01:00Z',
                level: 'INFO',
                message: 'Retry successful',
            },
            {
                timestamp: '2025-11-30T10:02:00Z',
                level: 'ERROR',
                message: 'Timeout',
            },
            {
                timestamp: '2025-11-30T10:03:00Z',
                level: 'WARN',
                message: 'High memory usage',
            },
        ],
    })

    const parser = new JsonObject()
    parser.feed(...stringToBytes(logEntries))

    const stats = { ERROR: 0, INFO: 0, WARN: 0 }

    console.log('Analyzing log entries:')
    for (const [keyEntity, valueEntity] of parser.members()) {
        const key = keyEntity.read()

        if (key === 'logs') {
            const logsValue = valueEntity.read()
            if (logsValue instanceof JsonArray) {
                for (const logEntry of logsValue.items()) {
                    const entry = logEntry.read() as any
                    stats[entry.level as keyof typeof stats]++

                    if (entry.level === 'ERROR') {
                        console.log(
                            `  ERROR at ${entry.timestamp}: ${entry.message}`,
                        )
                    }
                }
            }
        }
    }

    console.log('\nLog Statistics:')
    console.log(`  Errors: ${stats.ERROR}`)
    console.log(`  Warnings: ${stats.WARN}`)
    console.log(`  Info: ${stats.INFO}`)
}

analyzeLogEntries()

// Scenario 3: API response transformation
console.log('\n=== Scenario 3: API Response Transformation ===')
function transformApiResponse() {
    const apiResponse = JSON.stringify({
        status: 'success',
        data: {
            users: [
                { id: 1, firstName: 'Alice', lastName: 'Smith', age: 30 },
                { id: 2, firstName: 'Bob', lastName: 'Jones', age: 25 },
            ],
        },
    })

    const parser = new JsonObject()
    parser.feed(...stringToBytes(apiResponse))

    const transformedUsers: any[] = []

    console.log('Transforming API response:')
    for (const [keyEntity, valueEntity] of parser.members()) {
        const key = keyEntity.read()

        if (key === 'data') {
            const dataValue = valueEntity.read() as JsonObject
            for (const [
                dataKeyEntity,
                dataValueEntity,
            ] of dataValue.members()) {
                const dataKey = dataKeyEntity.read()

                if (dataKey === 'users') {
                    const usersValue = dataValueEntity.read() as JsonArray
                    for (const userEntity of usersValue.items()) {
                        const user = userEntity.read() as any
                        // Transform: combine firstName and lastName
                        transformedUsers.push({
                            id: user.id,
                            fullName: `${user.firstName} ${user.lastName}`,
                            age: user.age,
                        })
                    }
                }
            }
        }
    }

    console.log('Transformed users:', transformedUsers)
}

transformApiResponse()

// Scenario 4: Data validation
console.log('\n=== Scenario 4: Data Validation ===')
function validateData() {
    const userData = JSON.stringify({
        users: [
            { id: 1, email: 'alice@example.com', age: 30 },
            { id: 2, email: 'invalid-email', age: 25 },
            { id: 3, email: 'bob@example.com', age: -5 }, // Invalid age
            { id: 4, email: 'charlie@example.com', age: 35 },
        ],
    })

    const parser = new JsonObject()
    parser.feed(...stringToBytes(userData))

    const errors: string[] = []

    console.log('Validating user data:')
    for (const [keyEntity, valueEntity] of parser.members()) {
        const key = keyEntity.read()

        if (key === 'users') {
            const usersValue = valueEntity.read() as JsonArray
            let index = 0

            for (const userEntity of usersValue.items()) {
                const user = userEntity.read() as any

                // Validate email
                if (!user.email.includes('@')) {
                    errors.push(`User ${user.id}: Invalid email format`)
                }

                // Validate age
                if (user.age < 0 || user.age > 120) {
                    errors.push(`User ${user.id}: Invalid age (${user.age})`)
                }

                index++
            }
        }
    }

    if (errors.length > 0) {
        console.log('Validation errors found:')
        errors.forEach((err) => console.log(`  ✗ ${err}`))
    } else {
        console.log('✓ All data valid')
    }
}

validateData()

// Scenario 5: Generating a CSV export
console.log('\n=== Scenario 5: Generate CSV from JSON ===')
function jsonToCsv() {
    const data = [
        { id: 1, name: 'Alice', department: 'Engineering', salary: 95000 },
        { id: 2, name: 'Bob', department: 'Sales', salary: 85000 },
        { id: 3, name: 'Charlie', department: 'Engineering', salary: 90000 },
    ]

    console.log('Converting JSON array to CSV:')

    // Headers
    const headers = Object.keys(data[0])
    console.log(headers.join(','))

    // Process each record
    const parser = new JsonArray()
    parser.feed(...stringToBytes(JSON.stringify(data)))

    for (const item of parser.items()) {
        const record = item.read() as any
        const row = headers.map((h) => record[h]).join(',')
        console.log(row)
    }
}

jsonToCsv()

// Scenario 6: Filtering large datasets
console.log('\n=== Scenario 6: Filter Large Dataset ===')
function filterLargeDataset() {
    // Simulate a large dataset of transactions
    const transactions = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        amount: Math.floor(Math.random() * 1000),
        type: i % 3 === 0 ? 'refund' : 'payment',
        date: '2025-11-30',
    }))

    const parser = new JsonArray()
    parser.feed(...stringToBytes(JSON.stringify(transactions)))

    console.log('Filtering for high-value payments (>500):')
    let totalFiltered = 0
    let sumFiltered = 0

    for (const item of parser.items()) {
        const tx = item.read() as any

        if (tx.type === 'payment' && tx.amount > 500) {
            console.log(`  Transaction ${tx.id}: $${tx.amount}`)
            totalFiltered++
            sumFiltered += tx.amount
        }
    }

    console.log(
        `\nFound ${totalFiltered} transactions totaling $${sumFiltered}`,
    )
}

filterLargeDataset()

// Scenario 7: Building a report
console.log('\n=== Scenario 7: Generate Report ===')
function generateReport() {
    const salesData = {
        period: 'Q4 2025',
        regions: [
            { name: 'North', sales: 125000, target: 100000 },
            { name: 'South', sales: 95000, target: 100000 },
            { name: 'East', sales: 110000, target: 100000 },
            { name: 'West', sales: 88000, target: 100000 },
        ],
    }

    const parser = new JsonObject()
    parser.feed(...stringToBytes(JSON.stringify(salesData)))

    console.log('Sales Report:')

    for (const [keyEntity, valueEntity] of parser.members()) {
        const key = keyEntity.read()

        if (key === 'period') {
            console.log(`Period: ${valueEntity.read().read()}`)
            console.log('─'.repeat(50))
        } else if (key === 'regions') {
            const regionsValue = valueEntity.read() as JsonArray
            let totalSales = 0
            let totalTarget = 0

            for (const regionEntity of regionsValue.items()) {
                const region = regionEntity.read() as any
                totalSales += region.sales
                totalTarget += region.target

                const performance = (
                    (region.sales / region.target) *
                    100
                ).toFixed(1)
                const status = region.sales >= region.target ? '✓' : '✗'

                console.log(
                    `${status} ${region.name.padEnd(10)} Sales: $${region.sales.toLocaleString().padStart(10)} (${performance}% of target)`,
                )
            }

            console.log('─'.repeat(50))
            console.log(`Total Sales: $${totalSales.toLocaleString()}`)
            console.log(`Total Target: $${totalTarget.toLocaleString()}`)
            console.log(
                `Overall Performance: ${((totalSales / totalTarget) * 100).toFixed(1)}%`,
            )
        }
    }
}

generateReport()

console.log('\n=== All scenarios completed ===')
