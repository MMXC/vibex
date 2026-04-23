#!/usr/bin/env python3
content = open('src/lib/db.ts').read()
old = "as ReturnType<typeof import('@prisma/client')['PrismaClient']['prototype']['constructor']>>;\n"
new = "as PrismaClientType>;\n"
print('found:', old in content)
content = content.replace(old, new, 3)
with open('src/lib/db.ts', 'w') as f:
    f.write(content)
lines = content.split('\n')
for i, line in enumerate(lines, 1):
    if 'as PrismaClientType>' in line or 'as ReturnType' in line:
        print(i, repr(line))