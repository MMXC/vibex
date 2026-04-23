#!/usr/bin/env python3
import os, re

# Files with two-arg pattern that need updating
two_arg_files = [
    'src/app/api/agents/route.ts',
    'src/app/api/ai-ui-generation/route.ts',
    'src/app/api/pages/route.ts',
    'src/app/api/prototype-snapshots/route.ts',
    'src/app/api/v1/templates/route.ts',
    'src/app/api/projects/route.ts',
    'src/app/api/projects/[id]/route.ts',
    'src/app/api/v1/chat/route.ts',
    'src/app/api/v1/flows/[flowId]/route.ts',
    'src/app/api/v1/pages/route.ts',
    'src/app/api/v1/users/[userId]/route.ts',
    'src/app/api/v1/agents/route.ts',
    'src/app/api/v1/ai-ui-generation/route.ts',
    'src/app/api/v1/prototype-snapshots/route.ts',
    'src/app/api/v1/domain-model/[projectId]/route.ts',
    'src/app/api/v1/messages/[messageId]/route.ts',
    'src/app/api/v1/messages/route.ts',
    'src/app/api/v1/canvas/generate-contexts/route.ts',
    'src/app/api/v1/canvas/generate-components/route.ts',
    'src/app/api/v1/canvas/generate-flows/route.ts',
    'src/app/api/v1/canvas/generate/route.ts',
    'src/app/api/v1/canvas/stream/route.ts',
    'src/app/api/v1/canvas/status/route.ts',
    'src/app/api/v1/canvas/export/route.ts',
    'src/app/api/v1/canvas/project/route.ts',
    'src/app/api/v1/analyze/stream/route.ts',
    'src/app/api/v1/auth/logout/route.ts',
    'src/app/api/chat/route.ts',
    'src/app/api/flows/[flowId]/route.ts',
    'src/app/api/users/[userId]/route.ts',
    'src/app/api/messages/[messageId]/route.ts',
    'src/app/api/messages/route.ts',
    'src/app/api/auth/logout/route.ts',
]

for path in two_arg_files:
    if not os.path.exists(path):
        print(f"SKIP: {path}")
        continue
    content = open(path).read()
    original = content

    # Step 1: Remove second arg from getAuthUserFromRequest calls
    # Pattern: getAuthUserFromRequest(request, env.JWT_SECRET) -> getAuthUserFromRequest(request)
    content = re.sub(
        r'getAuthUserFromRequest\((request|req),\s*[^)]+\)',
        lambda m: f'getAuthUserFromRequest({m.group(1)})',
        content
    )

    # Step 2: Change const auth = getAuthUserFromRequest -> const { success, user } = getAuthUserFromRequest
    content = re.sub(
        r'const\s+auth\s+=\s+getAuthUserFromRequest\((request|req)\);',
        lambda m: f'const {{ success, user }} = getAuthUserFromRequest({m.group(1)});',
        content
    )

    # Step 3: Fix !auth.success -> !success
    content = re.sub(r'!auth\.success', '!success', content)
    content = re.sub(r'auth\.success', 'success', content)

    # Step 4: Fix auth.userId -> user?.userId
    content = re.sub(r'\bauth\.userId\b', 'user?.userId', content)
    content = re.sub(r'\bauth\.email\b', 'user?.email', content)
    content = re.sub(r'\bauth\.name\b', 'user?.name', content)
    content = re.sub(r'\bauth\.user\b', 'user', content)

    if content != original:
        open(path, 'w').write(content)
        print(f"FIXED: {path}")

print("Done")