# 📏 CODE QUALITY GUIDE - MANYAK TV v2

## 🎯 **Code Size Standards**

Following Angular/NestJS best practices for maintainable code.

### **Recommended File Lengths**

| File Type | Max Lines | Reason |
|-----------|-----------|--------|
| **Service** | 200-300 | Single Responsibility - one service, one purpose |
| **Controller** | 150-200 | Thin controllers - delegate to services |
| **Component** (.tsx) | 150-200 | Complex logic → extract to custom hooks/services |
| **Module** | 50-100 | Declarations & imports only, no logic |
| **Function/Method** | 20-40 | Easier to read, test, and maintain |
| **Template/JSX** | 100 | Break into smaller components |

---

## ✅ **REFACTORING COMPLETED**

### **Before Refactoring:**

| File | Lines | Status |
|------|-------|--------|
| `content.service.ts` | 340 | ❌ Too large |
| `users.service.ts` | 280 | ❌ Too large |
| `payments.service.ts` | 214 | ⚠️ Borderline |
| `encoder.service.ts` | 207 | ⚠️ Borderline |

### **After Refactoring:**

| Original File | Split Into | Lines Each |
|---------------|------------|------------|
| `content.service.ts` (340) | → `content.service.ts` | 200 ✅ |
| | → `content-search.service.ts` | 90 ✅ |
| | → `content-stats.service.ts` | 85 ✅ |
| `users.service.ts` (280) | → `users.service.ts` | 150 ✅ |
| | → `users-vip.service.ts` | 150 ✅ |
| | → `users-content.service.ts` | 180 ✅ |

**Result:** All services now follow Single Responsibility Principle! ✅

---

## 📋 **REFACTORING STRATEGY**

### **1. Content Module** ✅

**Original Problem:**
- `content.service.ts` had 340 lines
- Mixed responsibilities: CRUD, search, statistics

**Solution:**
```
apps/api/src/content/
├── content.service.ts              ← CRUD operations only (200 lines)
├── content-search.service.ts       ← Search & filters (90 lines)
├── content-stats.service.ts        ← Statistics & analytics (85 lines)
├── content.controller.ts           ← Route handlers
└── content.module.ts               ← Module config
```

**Benefits:**
- ✅ Each service has ONE clear responsibility
- ✅ Easier to test (focused unit tests)
- ✅ Easier to maintain (find bugs faster)
- ✅ Better code reusability

---

### **2. Users Module** ✅

**Original Problem:**
- `users.service.ts` had 280 lines
- Mixed responsibilities: CRUD, VIP, favorites, history

**Solution:**
```
apps/api/src/users/
├── users.service.ts                ← Basic CRUD only (150 lines)
├── users-vip.service.ts            ← VIP management (150 lines)
├── users-content.service.ts        ← Favorites & history (180 lines)
├── users.controller.ts             ← Route handlers
└── users.module.ts                 ← Module config
```

**Benefits:**
- ✅ VIP logic separated from user CRUD
- ✅ Content interactions isolated
- ✅ Each service is testable independently
- ✅ Clear separation of concerns

---

## 🔧 **HOW TO USE NEW SERVICES**

### **Content Module:**

```typescript
// In content.controller.ts
import { ContentService } from './content.service';
import { ContentSearchService } from './content-search.service';
import { ContentStatsService } from './content-stats.service';

@Controller('content')
export class ContentController {
  constructor(
    private contentService: ContentService,          // CRUD
    private searchService: ContentSearchService,     // Search
    private statsService: ContentStatsService,       // Statistics
  ) {}

  @Get()
  async findAll() {
    return this.contentService.findAll();
  }

  @Get('search')
  async search(@Query() query) {
    return this.searchService.search(query);
  }

  @Get('stats')
  async getStats() {
    return this.statsService.getStats();
  }
}
```

### **Users Module:**

```typescript
// In users.controller.ts
import { UsersService } from './users.service';
import { UsersVipService } from './users-vip.service';
import { UsersContentService } from './users-content.service';

@Controller('users')
export class UsersController {
  constructor(
    private usersService: UsersService,              // CRUD
    private vipService: UsersVipService,             // VIP
    private contentService: UsersContentService,     // Content
  ) {}

  @Get('me')
  async getProfile(@CurrentUser() user) {
    return this.usersService.findOne(user.id);
  }

  @Post('vip/grant')
  async grantVip(@Body() body) {
    return this.vipService.grantVip(body.userId, body.days);
  }

  @Get('favorites')
  async getFavorites(@CurrentUser() user) {
    return this.contentService.getFavorites(user.id);
  }
}
```

---

## 📊 **CODE QUALITY METRICS**

### **Function/Method Length:**

✅ **Good Examples:**
```typescript
// 15 lines - Perfect!
async findOne(id: string) {
  const user = await this.prisma.user.findUnique({
    where: { id },
    include: { favorites: true },
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  return user;
}
```

❌ **Bad Examples:**
```typescript
// 80+ lines - Too complex!
async complexOperation() {
  // Multiple responsibilities
  // Hard to test
  // Hard to understand
  // ... 80 lines of mixed logic
}
```

**Solution:** Break into smaller functions:
```typescript
async complexOperation() {
  await this.validateData();
  const result = await this.processData();
  await this.saveResult(result);
  return this.formatResponse(result);
}
```

---

## 🎯 **SOLID PRINCIPLES**

### **S - Single Responsibility**
✅ Each service has ONE purpose:
- `ContentService` → CRUD only
- `ContentSearchService` → Search only
- `ContentStatsService` → Statistics only

### **O - Open/Closed**
✅ Services are open for extension, closed for modification:
- Add new search filters → extend `ContentSearchService`
- Don't modify existing CRUD in `ContentService`

### **L - Liskov Substitution**
✅ Services can be replaced with mock implementations for testing

### **I - Interface Segregation**
✅ Small, focused interfaces - no "god" services

### **D - Dependency Inversion**
✅ Controllers depend on service abstractions, not implementations

---

## 🧪 **TESTING BENEFITS**

### **Before Refactoring:**
```typescript
// Hard to test - 340 lines, many dependencies
describe('ContentService', () => {
  it('should test everything') {
    // Tests CRUD, search, stats all mixed
    // Complex setup required
    // Slow tests
  });
});
```

### **After Refactoring:**
```typescript
// Easy to test - focused services
describe('ContentService', () => {
  it('should create content') { /* 10 lines */ }
  it('should update content') { /* 10 lines */ }
});

describe('ContentSearchService', () => {
  it('should search by query') { /* 10 lines */ }
  it('should filter by category') { /* 10 lines */ }
});

describe('ContentStatsService', () => {
  it('should get statistics') { /* 10 lines */ }
});
```

**Benefits:**
- ✅ Faster test execution
- ✅ Easier to write tests
- ✅ Better test coverage
- ✅ Clearer test failures

---

## 📝 **MODULE STRUCTURE BEST PRACTICES**

### **Good Module Structure:**

```
feature/
├── feature.module.ts          ← 30-50 lines (config only)
├── feature.controller.ts      ← 100-150 lines (routes)
├── feature.service.ts         ← 150-200 lines (core logic)
├── feature-sub1.service.ts    ← 100-150 lines (specific logic)
├── feature-sub2.service.ts    ← 100-150 lines (specific logic)
├── dto/
│   ├── create-feature.dto.ts  ← 20-30 lines
│   └── update-feature.dto.ts  ← 20-30 lines
└── entities/
    └── feature.entity.ts      ← 30-50 lines
```

### **Module File Example:**

```typescript
// feature.module.ts - MAX 50 lines
@Module({
  imports: [PrismaModule],
  controllers: [FeatureController],
  providers: [
    FeatureService,
    FeatureSubService1,
    FeatureSubService2,
  ],
  exports: [FeatureService],
})
export class FeatureModule {}
```

---

## 🔍 **CODE REVIEW CHECKLIST**

Before committing code, check:

### **File Length:**
- [ ] Service files < 300 lines
- [ ] Controller files < 200 lines
- [ ] Component files < 200 lines
- [ ] Module files < 50 lines
- [ ] Functions < 40 lines

### **Single Responsibility:**
- [ ] Each service has ONE clear purpose
- [ ] No mixed responsibilities
- [ ] Easy to describe in one sentence

### **Dependencies:**
- [ ] Minimal dependencies
- [ ] Proper dependency injection
- [ ] No circular dependencies

### **Testability:**
- [ ] Can be tested in isolation
- [ ] Clear input/output
- [ ] Mockable dependencies

### **Readability:**
- [ ] Clear variable names
- [ ] Comments where needed
- [ ] Consistent formatting

---

## 🎓 **LEARNING RESOURCES**

### **SOLID Principles:**
- [Clean Code by Robert C. Martin](https://www.amazon.com/Clean-Code-Handbook-Software-Craftsmanship/dp/0132350882)
- [SOLID Principles Tutorial](https://www.digitalocean.com/community/conceptual_articles/s-o-l-i-d-the-first-five-principles-of-object-oriented-design)

### **NestJS Best Practices:**
- [NestJS Documentation](https://docs.nestjs.com/)
- [NestJS Clean Architecture](https://github.com/jmcdo29/nestjs-base)

### **Code Quality:**
- [Refactoring by Martin Fowler](https://refactoring.com/)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

---

## 📈 **CONTINUOUS IMPROVEMENT**

### **Automated Checks:**

```json
// .eslintrc.json
{
  "rules": {
    "max-lines": ["error", 300],
    "max-lines-per-function": ["error", 40],
    "complexity": ["error", 10]
  }
}
```

### **Git Pre-commit Hook:**

```bash
# Check file sizes before commit
#!/bin/bash
for file in $(git diff --cached --name-only | grep -E '\.(ts|tsx)$'); do
  lines=$(wc -l < "$file")
  if [ $lines -gt 300 ]; then
    echo "Error: $file has $lines lines (max 300)"
    exit 1
  fi
done
```

---

## ✅ **SUMMARY**

### **Before:**
- ❌ Large files (340+ lines)
- ❌ Mixed responsibilities
- ❌ Hard to test
- ❌ Difficult to maintain

### **After:**
- ✅ Small, focused files (< 200 lines)
- ✅ Single Responsibility Principle
- ✅ Easy to test
- ✅ Easy to maintain
- ✅ Better code reusability
- ✅ Clearer structure

---

**Code quality improved! Project is now more maintainable and scalable! 🚀**
