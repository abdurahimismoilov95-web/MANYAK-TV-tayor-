# Fix Prisma enum imports for V6 compatibility
# Changes: import { ContentType } from '@prisma/client'
# To: import { Prisma } from '@prisma/client'; type ContentType = Prisma.ContentType;

$files = Get-ChildItem -Path "apps/api/src" -Recurse -Filter "*.ts"

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $changed = $false
    
    # Fix ContentType import
    if ($content -match "import \{ ContentType \} from '@prisma/client';") {
        $content = $content -replace "import \{ ContentType \} from '@prisma/client';", "import { Prisma } from '@prisma/client';`ntype ContentType = Prisma.ContentType;"
        $changed = $true
    }
    
    # Fix PaymentType, PaymentStatus import
    if ($content -match "import \{ PaymentType, PaymentStatus \} from '@prisma/client';") {
        $content = $content -replace "import \{ PaymentType, PaymentStatus \} from '@prisma/client';", "import { Prisma } from '@prisma/client';`ntype PaymentType = Prisma.PaymentType;`ntype PaymentStatus = Prisma.PaymentStatus;"
        $changed = $true
    }
    
    if ($changed) {
        Set-Content -Path $file.FullName -Value $content
        Write-Host "✅ Fixed: $($file.FullName)"
    }
}

Write-Host "`n✅ All Prisma imports fixed!"
