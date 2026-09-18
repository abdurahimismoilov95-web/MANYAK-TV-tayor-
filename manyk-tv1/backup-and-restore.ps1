# MANYAK TV - Database va Uploads Backup & Restore Script (PowerShell)
# Railway Volume'ga migration qilish uchun

$BackupDir = ".\railway-migration-backup"
$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"

Write-Host "╔════════════════════════════════════════╗" -ForegroundColor Green
Write-Host "║  MANYAK TV - Backup & Restore Tool    ║" -ForegroundColor Green
Write-Host "╚════════════════════════════════════════╝" -ForegroundColor Green
Write-Host ""

# ============================================
# FUNCTION: Backup
# ============================================
function Backup-Data {
    Write-Host "📦 Backup boshlanmoqda..." -ForegroundColor Yellow
    
    # Backup papkasini yaratish
    if (!(Test-Path $BackupDir)) {
        New-Item -ItemType Directory -Path $BackupDir | Out-Null
    }
    
    # Database backup
    if (Test-Path ".\data\manyktv.db") {
        Write-Host "  ✓ Database topildi: .\data\manyktv.db" -ForegroundColor White
        $destPath = Join-Path $BackupDir "data_$Timestamp"
        Copy-Item -Path ".\data" -Destination $destPath -Recurse
        Write-Host "  ✓ Database backup: $destPath" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Database topilmadi: .\data\manyktv.db" -ForegroundColor Red
    }
    
    # Uploads backup
    if (Test-Path ".\uploads") {
        Write-Host "  ✓ Uploads papkasi topildi" -ForegroundColor White
        $destPath = Join-Path $BackupDir "uploads_$Timestamp"
        Copy-Item -Path ".\uploads" -Destination $destPath -Recurse
        Write-Host "  ✓ Uploads backup: $destPath" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Uploads papkasi topilmadi" -ForegroundColor Yellow
    }
    
    # Backups papkasini ham saqlash
    if (Test-Path ".\backups") {
        Write-Host "  ✓ Backups papkasi topildi" -ForegroundColor White
        $destPath = Join-Path $BackupDir "backups_$Timestamp"
        Copy-Item -Path ".\backups" -Destination $destPath -Recurse
        Write-Host "  ✓ Backups saqlandi: $destPath" -ForegroundColor Green
    }
    
    # ZIP qilish
    Write-Host ""
    Write-Host "📦 ZIP arxiv yaratilmoqda..." -ForegroundColor Yellow
    $zipPath = Join-Path $BackupDir "manyak-tv-backup-$Timestamp.zip"
    Compress-Archive -Path "$BackupDir\*_$Timestamp" -DestinationPath $zipPath -Force
    
    Write-Host "✅ Backup muvaffaqiyatli yaratildi!" -ForegroundColor Green
    Write-Host "   Fayl: $zipPath" -ForegroundColor Green
    Write-Host ""
    Write-Host "📤 Bu faylni saqlang - keyinchalik restore qilish uchun kerak bo'ladi!" -ForegroundColor Yellow
}

# ============================================
# FUNCTION: Restore
# ============================================
function Restore-Data {
    Write-Host "📥 Restore boshlanmoqda..." -ForegroundColor Yellow
    Write-Host ""
    
    # Backup fayllarini ko'rsatish
    Write-Host "Mavjud backup fayllar:" -ForegroundColor White
    Get-ChildItem -Path $BackupDir -Filter "*.zip" | ForEach-Object {
        Write-Host "  - $($_.Name)" -ForegroundColor Cyan
    }
    Write-Host ""
    
    $backupFile = Read-Host "Restore qilish uchun fayl nomini kiriting"
    $backupPath = Join-Path $BackupDir $backupFile
    
    if (!(Test-Path $backupPath)) {
        Write-Host "✗ Fayl topilmadi: $backupPath" -ForegroundColor Red
        return
    }
    
    # Extract
    Write-Host "📂 Arxivni ochish..." -ForegroundColor Yellow
    $extractPath = Join-Path $BackupDir "extracted_$Timestamp"
    Expand-Archive -Path $backupPath -DestinationPath $extractPath -Force
    
    # Restore database
    $dataFolder = Get-ChildItem -Path $extractPath -Filter "data_*" -Directory | Select-Object -First 1
    if ($dataFolder) {
        Write-Host "📊 Database tiklanmoqda..." -ForegroundColor Yellow
        if (Test-Path ".\data") {
            Remove-Item -Path ".\data" -Recurse -Force
        }
        Copy-Item -Path $dataFolder.FullName -Destination ".\data" -Recurse
        Write-Host "✓ Database tiklandi" -ForegroundColor Green
    }
    
    # Restore uploads
    $uploadsFolder = Get-ChildItem -Path $extractPath -Filter "uploads_*" -Directory | Select-Object -First 1
    if ($uploadsFolder) {
        Write-Host "📁 Uploads tiklanmoqda..." -ForegroundColor Yellow
        if (Test-Path ".\uploads") {
            Remove-Item -Path ".\uploads" -Recurse -Force
        }
        Copy-Item -Path $uploadsFolder.FullName -Destination ".\uploads" -Recurse
        Write-Host "✓ Uploads tiklandi" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "✅ Restore muvaffaqiyatli yakunlandi!" -ForegroundColor Green
}

# ============================================
# FUNCTION: Railway Migration
# ============================================
function Migrate-ToRailway {
    Write-Host "🚀 Railway Volume'ga migration" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Bu script quyidagi qadamlarni bajaradi:"
    Write-Host "  1. Local'dagi ma'lumotlarni backup qiladi"
    Write-Host "  2. Railway Volume yaratish ko'rsatmalarini beradi"
    Write-Host "  3. Railway'ga backup yuklashni tushuntiradi"
    Write-Host ""
    
    # Backup
    Backup-Data
    
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "║  KEYINGI QADAMLAR - Railway Volume Setup         ║" -ForegroundColor Green
    Write-Host "╚════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "1. Railway Dashboard'ga kiring: https://railway.app" -ForegroundColor White
    Write-Host ""
    Write-Host "2. Volume'lar yarating:" -ForegroundColor White
    Write-Host "   - Volume 1: manyak-tv-database" -ForegroundColor Cyan
    Write-Host "     Mount Path: /app/data" -ForegroundColor Gray
    Write-Host ""
    Write-Host "   - Volume 2: manyak-tv-uploads" -ForegroundColor Cyan
    Write-Host "     Mount Path: /app/uploads" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. RAILWAY_VOLUME_SETUP.md faylini o'qing!" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "✅ Ma'lumotlar Railway Volume'da saqlanadi!" -ForegroundColor Green
}

# ============================================
# MAIN MENU
# ============================================
Write-Host "Quyidagilardan birini tanlang:" -ForegroundColor White
Write-Host ""
Write-Host "  1) Backup - Ma'lumotlarni saqlash" -ForegroundColor Cyan
Write-Host "  2) Restore - Ma'lumotlarni tiklash" -ForegroundColor Cyan
Write-Host "  3) Railway Migration - Volume'ga ko'chirish" -ForegroundColor Cyan
Write-Host "  4) Chiqish" -ForegroundColor Cyan
Write-Host ""
$choice = Read-Host "Tanlang (1-4)"

switch ($choice) {
    "1" { Backup-Data }
    "2" { Restore-Data }
    "3" { Migrate-ToRailway }
    "4" { Write-Host "Dasturdan chiqildi." -ForegroundColor White; exit }
    default { Write-Host "Noto'g'ri tanlov!" -ForegroundColor Red; exit }
}

Write-Host ""
Write-Host "Enter tugmasini bosing..." -ForegroundColor Gray
Read-Host
