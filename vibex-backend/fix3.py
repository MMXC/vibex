#!/usr/bin/env python3
content = open('src/lib/db.ts').read()

# Add type alias before PoolConfig
old = 'interface PoolConfig {'
new = '''type PrismaClientType = {
  dollar_queryRawUnsafe: <T = unknown>(sql: string, ...params: unknown[]) => Promise<T[]>;
  dollar_executeRawUnsafe: (sql: string, ...params: unknown[]) => Promise<number>;
  dollar_transaction: any;
  dollar_disconnect: () => Promise<unknown>;
};

interface PoolConfig {'''
content = content.replace(old, new, 1)

# Replace cast
old_cast = "as ReturnType<typeof import('@prisma/client')['PrismaClient']['prototype']['constructor']>;\n"
new_cast = "as PrismaClientType;\n"
content = content.replace(old_cast, new_cast, 3)

# Fix property names
content = content.replace('dollar_queryRawUnsafe', '$queryRawUnsafe')
content = content.replace('dollar_executeRawUnsafe', '$executeRawUnsafe')
content = content.replace('dollar_transaction', '$transaction')
content = content.replace('dollar_disconnect', '$disconnect')

# Fix $transaction tx type - replace the callback
old_tx = 'return prisma.$transaction(async (tx) => {'
# Use dollar notation in the source
old_tx2 = 'return prisma.dollar_transaction(async (tx) => {'
if old_tx2 in content:
    content = content.replace(old_tx2, 'return prisma.$transaction(async (tx: PrismaClientType) => {')
else:
    # Try to find the pattern
    idx = content.find('return prisma.$transaction(async (tx) => {')
    if idx >= 0:
        old = 'return prisma.$transaction(async (tx) => {'
        new = 'return prisma.$transaction(async (tx: PrismaClientType) => {'
        content = content.replace(old, new)

with open('src/lib/db.ts', 'w') as f:
    f.write(content)
print('done')