#!/bin/bash

# MANYAK TV - Database va Uploads Backup & Restore Script
# Railway Volume'ga migration qilish uchun

set -e  # Exit on error

BACKUP_DIR="./railway-migration-backup"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  MANYAK TV - Backup & Restore Tool    ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""

# ============================================
# FUNCTION: Backup ma'lumotlarni olish
# ============================================
backup() {
    echo -e "${YELLOW}📦 Backup boshlanmoqda...${NC}"
    
    # Backup papkasini yaratish
    mkdir -p "$BACKUP_DIR"
    
    # Database backup
    if [ -f "./data/manyktv.db" ]; then
        echo "  ✓ Database topildi: ./data/manyktv.db"
        cp -r ./data "$BACKUP_DIR/data_$TIMESTAMP"
        echo -e "  ${GREEN}✓ Database backup: $BACKUP_DIR/data_$TIMESTAMP${NC}"
    else
        echo -e "  ${RED}✗ Database topilmadi: ./data/manyktv.db${NC}"
    fi
    
    # Uploads backup
    if [ -d "./uploads" ]; then
        echo "  ✓ Uploads papkasi topildi"
        cp -r ./uploads "$BACKUP_DIR/uploads_$TIMESTAMP"
        echo -e "  ${GREEN}✓ Uploads backup: $BACKUP_DIR/uploads_$TIMESTAMP${NC}"
    else
        echo -e "  ${YELLOW}⚠ Uploads papkasi topilmadi${NC}"
    fi
    
    # Backups papkasini ham saqlash
    if [ -d "./backups" ]; then
        echo "  ✓ Backups papkasi topildi"
        cp -r ./backups "$BACKUP_DIR/backups_$TIMESTAMP"
        echo -e "  ${GREEN}✓ Backups saqlandi: $BACKUP_DIR/backups_$TIMESTAMP${NC}"
    fi
    
    # ZIP qilish
    echo ""
    echo -e "${YELLOW}📦 ZIP arxiv yaratilmoqda...${NC}"
    cd "$BACKUP_DIR"
    tar -czf "manyak-tv-backup-$TIMESTAMP.tar.gz" *_$TIMESTAMP
    cd ..
    
    echo -e "${GREEN}✅ Backup muvaffaqiyatli yaratildi!${NC}"
    echo -e "   Fayl: ${GREEN}$BACKUP_DIR/manyak-tv-backup-$TIMESTAMP.tar.gz${NC}"
    echo ""
    echo -e "${YELLOW}📤 Bu faylni saqlang - keyinchalik restore qilish uchun kerak bo'ladi!${NC}"
}

# ============================================
# FUNCTION: Restore ma'lumotlarni tiklash
# ============================================
restore() {
    echo -e "${YELLOW}📥 Restore boshlanmoqda...${NC}"
    echo ""
    
    # Backup fayllarini ko'rsatish
    echo "Mavjud backup fayllar:"
    ls -lh "$BACKUP_DIR"/*.tar.gz 2>/dev/null || echo "  Backup fayllar topilmadi!"
    echo ""
    
    read -p "Restore qilish uchun fayl nomini kiriting (masalan: manyak-tv-backup-20260911_120000.tar.gz): " BACKUP_FILE
    
    if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
        echo -e "${RED}✗ Fayl topilmadi: $BACKUP_DIR/$BACKUP_FILE${NC}"
        exit 1
    fi
    
    # Extract
    echo -e "${YELLOW}📂 Arxivni ochish...${NC}"
    cd "$BACKUP_DIR"
    tar -xzf "$BACKUP_FILE"
    cd ..
    
    # Find extracted folders
    DATA_FOLDER=$(ls -d "$BACKUP_DIR"/data_* 2>/dev/null | head -n 1)
    UPLOADS_FOLDER=$(ls -d "$BACKUP_DIR"/uploads_* 2>/dev/null | head -n 1)
    
    # Restore database
    if [ -d "$DATA_FOLDER" ]; then
        echo -e "${YELLOW}📊 Database tiklanmoqda...${NC}"
        rm -rf ./data
        cp -r "$DATA_FOLDER" ./data
        echo -e "${GREEN}✓ Database tiklandi${NC}"
    fi
    
    # Restore uploads
    if [ -d "$UPLOADS_FOLDER" ]; then
        echo -e "${YELLOW}📁 Uploads tiklanmoqda...${NC}"
        rm -rf ./uploads
        cp -r "$UPLOADS_FOLDER" ./uploads
        echo -e "${GREEN}✓ Uploads tiklandi${NC}"
    fi
    
    echo ""
    echo -e "${GREEN}✅ Restore muvaffaqiyatli yakunlandi!${NC}"
}

# ============================================
# FUNCTION: Railway'ga migration
# ============================================
migrate_to_railway() {
    echo -e "${YELLOW}🚀 Railway Volume'ga migration${NC}"
    echo ""
    echo "Bu script quyidagi qadamlarni bajaradi:"
    echo "  1. Local'dagi ma'lumotlarni backup qiladi"
    echo "  2. Railway Volume yaratish ko'rsatmalarini beradi"
    echo "  3. Railway'ga backup yuklashni tushuntiradi"
    echo ""
    
    # Backup
    backup
    
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  KEYINGI QADAMLAR - Railway Volume Setup         ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "1. Railway Dashboard'ga kiring: https://railway.app"
    echo ""
    echo "2. Volume'lar yarating:"
    echo "   - Volume 1: manyak-tv-database"
    echo "     Mount Path: /app/data"
    echo ""
    echo "   - Volume 2: manyak-tv-uploads"
    echo "     Mount Path: /app/uploads"
    echo ""
    echo "3. Railway CLI orqali backup yuklash:"
    echo "   railway shell"
    echo "   # Keyin local terminal'da:"
    echo "   railway run --service=manyak-tv bash -c 'cat > /tmp/backup.tar.gz' < $BACKUP_DIR/manyak-tv-backup-$TIMESTAMP.tar.gz"
    echo ""
    echo "4. Railway shell'da extract qilish:"
    echo "   cd /tmp"
    echo "   tar -xzf backup.tar.gz"
    echo "   cp -r data_*/* /app/data/"
    echo "   cp -r uploads_*/* /app/uploads/"
    echo ""
    echo "5. Server'ni restart qiling:"
    echo "   railway restart"
    echo ""
    echo -e "${GREEN}✅ Ma'lumotlar endi Railway Volume'da saqlanadi!${NC}"
}

# ============================================
# MAIN MENU
# ============================================
echo "Quyidagilardan birini tanlang:"
echo ""
echo "  1) Backup - Ma'lumotlarni saqlash"
echo "  2) Restore - Ma'lumotlarni tiklash"
echo "  3) Railway Migration - Volume'ga ko'chirish"
echo "  4) Chiqish"
echo ""
read -p "Tanlang (1-4): " CHOICE

case $CHOICE in
    1)
        backup
        ;;
    2)
        restore
        ;;
    3)
        migrate_to_railway
        ;;
    4)
        echo "Dasturdan chiqildi."
        exit 0
        ;;
    *)
        echo -e "${RED}Noto'g'ri tanlov!${NC}"
        exit 1
        ;;
esac
