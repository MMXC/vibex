#!/usr/bin/env python3
content = open('src/lib/db.ts').read()

# Add PrismaClientType before PoolConfig
old = 'interface PoolConfig {'
new = '''type PrismaClientType = {
  $queryRawUnsafe: (sql: string, ...params: unknown[]) => Promise<unknown>;
  $executeRawUnsafe: (sql: string, ...params: unknown[]) => Promise<number>;
  $transaction: any;
  $disconnect: () => Promise<unknown>;
};

interface PoolConfig {'''
content = content.replace(old, new, 1)

# Replace cast
old_cast = "as ReturnType<typeof import('@prisma/client')['PrismaClient']['prototype']['constructor']>;\n"
new_cast = "as PrismaClientType;\n"
content = content.replace(old_cast, new_cast, 3)

# Fix generic call sites
old_call = "const result = await prisma.$queryRawUnsafe<T[]>(sql, ...params);"
new_call = "const result = (await prisma.$queryRawUnsafe(sql, ...params)) as T[];"
content = content.replace(old_call, new_call, 3)

# Fix $transaction callback tx type
old_tx = "return prisma.$transaction(async (tx) => {"
new_tx = "return prisma.$transaction(async (tx: PrismaClientType) => {"
content = content.replace(old_tx, new_tx, 1)

with open('src/lib/db.ts', 'w') as f:
    f.write(content)
print("done")