# Fix Prisma enum imports - use direct imports from @prisma/client

$files = Get-ChildItem -Path "apps/api/src" -Recurse -Filter "*.ts"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $changed = $false
    
    # Fix imports that use Prisma.ContentType pattern
    if ($content -match "import \{ Prisma \} from '@prisma/client';[\r\n]+type ContentType = Prisma\.ContentType;") {
        $content = $content -replace "import \{ Prisma \} from '@prisma/client';[\r\n]+type ContentType = Prisma\.ContentType;", "import { ContentType } from '@prisma/client';"
        $changed = $true
    }
    
    # Fix payment types
    if ($content -match "import \{ Prisma \} from '@prisma/client';[\r\n]+type PaymentType = Prisma\.PaymentType;[\r\n]+type PaymentStatus = Prisma\.PaymentStatus;") {
        $content = $content -replace "import \{ Prisma \} from '@prisma/client';[\r\n]+type PaymentType = Prisma\.PaymentType;[\r\n]+type PaymentStatus = Prisma\.PaymentStatus;", "import { PaymentType, PaymentStatus } from '@prisma/client';"
        $changed = $true
    }
    
    if ($changed) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "✅ Fixed: $($file.Name)"
    }
}

Write-Host "`n✅ Reverted to direct imports!"
