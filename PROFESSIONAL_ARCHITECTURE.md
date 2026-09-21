# 🏗️ Professional Architecture Guide - MANYAK TV v2

## 📐 **Angular Best Practices Applied to React + NestJS**

This guide adapts professional Angular architecture principles to our React + NestJS stack.

---

## 1️⃣ **BACKEND ARCHITECTURE (NestJS)**

### ✅ **Current Structure - Already Professional!**

```
apps/api/src/
├── auth/                    ✅ Feature module
│   ├── guards/              ✅ Auth & role guards
│   ├── decorators/          ✅ Custom decorators
│   ├── strategies/          ✅ JWT & Telegram strategies
│   ├── auth.service.ts      ✅ ~150 lines (GOOD)
│   ├── auth.controller.ts   ✅ ~80 lines (GOOD)
│   └── auth.module.ts       ✅ ~40 lines (GOOD)
│
├── users/                   ✅ Feature module
│   ├── users.service.ts          → Core CRUD (150 lines)
│   ├── users-vip.service.ts      → VIP management (150 lines)
│   ├── users-content.service.ts  → Favorites/History (180 lines)
│   ├── users.controller.ts       ✅ ~150 lines (GOOD)
│   └── users.module.ts           ✅ ~30 lines (GOOD)
│
├── content/                 ✅ Feature module
│   ├── content.service.ts        → CRUD (200 lines)
│   ├── content-search.service.ts → Search logic (90 lines)
│   ├── content-stats.service.ts  → Statistics (85 lines)
│   ├── content.controller.ts     ✅ ~130 lines (GOOD)
│   └── content.module.ts         ✅ ~35 lines (GOOD)
│
├── payments/                ✅ Feature module
├── admin/                   ✅ Feature module
└── prisma/                  ✅ Core service (database)
```

### **✅ Follows Angular Best Practices:**
- ✅ Feature modules (auth, users, content, etc.)
- ✅ Single Responsibility (each service < 200 lines)
- ✅ Layered architecture (Controller → Service → Repository)
- ✅ Dependency Injection (NestJS native)
- ✅ Guards & Interceptors (like Angular)
- ✅ Module-based structure

---

## 2️⃣ **FRONTEND ARCHITECTURE (React)**

### ❌ **Current Structure - Needs Improvement:**

```
apps/web/src/
├── pages/           ← Mixed responsibilities
├── components/      ← Mixed responsibilities
├── store/           ← OK
└── lib/             ← OK
```

### ✅ **Recommended Professional Structure:**

```
apps/web/src/
├── core/                           ← App-wide singletons
│   ├── guards/                     
│   │   └── AuthGuard.tsx           (Route protection)
│   ├── interceptors/               
│   │   └── authInterceptor.ts      (Add token to requests)
│   ├── services/                   
│   │   ├── auth.service.ts         (Authentication logic)
│   │   └── storage.service.ts      (LocalStorage wrapper)
│   ├── models/                     
│   │   ├── user.model.ts           
│   │   └── api-response.model.ts   
│   └── hooks/                      
│       └── useAuth.ts              (Global auth hook)
│
├── shared/                         ← Reusable components
│   ├── components/                 
│   │   ├── Button/                 
│   │   │   ├── Button.tsx          
│   │   │   └── Button.module.css   
│   │   ├── Modal/                  
│   │   ├── Loader/                 
│   │   └── Pagination/             
│   ├── hooks/                      
│   │   ├── useDebounce.ts          
│   │   └── useInfiniteScroll.ts    
│   └── utils/                      
│       ├── formatDate.ts           
│       └── formatCurrency.ts       
│
├── features/                       ← Feature modules
│   ├── auth/                       
│   │   ├── components/             
│   │   │   ├── LoginForm.tsx       
│   │   │   └── RegisterForm.tsx    
│   │   ├── pages/                  
│   │   │   ├── LoginPage.tsx       
│   │   │   └── RegisterPage.tsx    
│   │   ├── hooks/                  
│   │   │   └── useLogin.ts         
│   │   └── auth.routes.tsx         
│   │
│   ├── dashboard/                  
│   │   ├── components/             
│   │   │   ├── StatsCard.tsx       
│   │   │   └── RecentActivity.tsx  
│   │   ├── pages/                  
│   │   │   └── DashboardPage.tsx   
│   │   └── dashboard.routes.tsx    
│   │
│   ├── content/                    
│   │   ├── components/             
│   │   │   ├── ContentCard.tsx        (Dumb - presentation only)
│   │   │   ├── ContentGrid.tsx        (Dumb)
│   │   │   └── ContentFilters.tsx     (Dumb)
│   │   ├── containers/             
│   │   │   ├── ContentListContainer.tsx  (Smart - has logic)
│   │   │   └── ContentDetailContainer.tsx (Smart)
│   │   ├── pages/                  
│   │   │   ├── ContentListPage.tsx 
│   │   │   └── ContentDetailPage.tsx
│   │   ├── hooks/                  
│   │   │   ├── useContentList.ts   
│   │   │   └── useContentDetail.ts 
│   │   ├── services/               
│   │   │   └── content.service.ts  
│   │   └── content.routes.tsx      
│   │
│   ├── player/                     
│   │   ├── components/             
│   │   │   ├── VideoPlayer.tsx     
│   │   │   └── PlayerControls.tsx  
│   │   ├── pages/                  
│   │   │   └── PlayerPage.tsx      
│   │   └── player.routes.tsx       
│   │
│   └── profile/                    
│       ├── components/             
│       ├── pages/                  
│       └── profile.routes.tsx      
│
├── layout/                         ← Layout components
│   ├── MainLayout.tsx              
│   ├── Header.tsx                  
│   ├── Footer.tsx                  
│   └── Sidebar.tsx                 
│
├── router/                         ← Routing config
│   ├── AppRouter.tsx               
│   └── routes.config.ts            
│
├── store/                          ← Global state
│   ├── authStore.ts                
│   ├── contentStore.ts             
│   └── uiStore.ts                  
│
├── App.tsx                         
└── main.tsx                        
```

---

## 3️⃣ **SMART vs DUMB COMPONENTS (React)**

### **Dumb (Presentational) Component:**

```tsx
// Dumb: Only renders UI, no logic
interface ContentCardProps {
  content: Content;
  onFavorite: (id: string) => void;
}

export function ContentCard({ content, onFavorite }: ContentCardProps) {
  return (
    <div className="content-card">
      <img src={content.thumbnail} alt={content.title} />
      <h3>{content.title}</h3>
      <button onClick={() => onFavorite(content.id)}>
        Favorite
      </button>
    </div>
  );
}
```

### **Smart (Container) Component:**

```tsx
// Smart: Has logic, fetches data
export function ContentListContainer() {
  const { contents, loading } = useContentList();
  const { addFavorite } = useFavorites();

  if (loading) return <Loader />;

  return (
    <div className="content-grid">
      {contents.map(content => (
        <ContentCard
          key={content.id}
          content={content}
          onFavorite={addFavorite}
        />
      ))}
    </div>
  );
}
```

---

## 4️⃣ **FILE SIZE STANDARDS**

| File Type | Max Lines | Current Status |
|-----------|-----------|----------------|
| **React Component** | 150-200 | ✅ Most < 150 |
| **Custom Hook** | 100-150 | ✅ Compliant |
| **Service** | 200-300 | ✅ Refactored |
| **Controller (NestJS)** | 150-200 | ✅ Compliant |
| **NestJS Service** | 200-300 | ✅ Refactored |
| **Module** | 50-100 | ✅ Compliant |
| **Function/Method** | 20-40 | ✅ Target |

---

## 5️⃣ **NAMING CONVENTIONS**

### **React:**
```
components/
├── Button/
│   ├── Button.tsx              ✅ PascalCase for component
│   ├── Button.module.css       ✅ module.css for scoped styles
│   ├── Button.test.tsx         ✅ .test.tsx for tests
│   └── index.ts                ✅ Barrel export
```

### **NestJS:**
```
users/
├── users.service.ts            ✅ kebab-case
├── users.controller.ts         ✅ kebab-case
├── users.module.ts             ✅ kebab-case
└── dto/
    ├── create-user.dto.ts      ✅ kebab-case
    └── update-user.dto.ts
```

### **Classes & Functions:**
```typescript
// Classes: PascalCase
class UserService {}
class ContentCard {}

// Functions/Variables: camelCase
function getUserData() {}
const isAuthenticated = true;

// Constants: UPPER_SNAKE_CASE
const API_BASE_URL = 'http://localhost:3000';
const MAX_FILE_SIZE = 5242880;
```

---

## 6️⃣ **STATE MANAGEMENT (React)**

### **Current: Zustand** ✅

```typescript
// authStore.ts
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  token: string | null;
  login: (credentials: Credentials) => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  
  login: async (credentials) => {
    const response = await authService.login(credentials);
    set({ user: response.user, token: response.token });
  },
  
  logout: () => {
    set({ user: null, token: null });
    localStorage.removeItem('token');
  },
}));
```

### **Usage in Components:**

```tsx
// Smart component
function ProfilePage() {
  const { user, logout } = useAuthStore();
  
  if (!user) return <Redirect to="/login" />;
  
  return <UserProfile user={user} onLogout={logout} />;
}

// Dumb component
function UserProfile({ user, onLogout }: Props) {
  return (
    <div>
      <h1>{user.name}</h1>
      <button onClick={onLogout}>Logout</button>
    </div>
  );
}
```

---

## 7️⃣ **API CALLS & SERVICES**

### **Service Layer:**

```typescript
// content.service.ts
class ContentService {
  private api = axios.create({
    baseURL: process.env.VITE_API_URL,
  });

  async getAll(params?: ContentParams): Promise<Content[]> {
    const response = await this.api.get('/content', { params });
    return response.data;
  }

  async getById(id: string): Promise<Content> {
    const response = await this.api.get(`/content/${id}`);
    return response.data;
  }

  async create(data: CreateContentDto): Promise<Content> {
    const response = await this.api.post('/content', data);
    return response.data;
  }
}

export const contentService = new ContentService();
```

### **Custom Hook:**

```typescript
// useContentList.ts
export function useContentList(filters?: ContentFilters) {
  const [contents, setContents] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchContents() {
      try {
        setLoading(true);
        const data = await contentService.getAll(filters);
        setContents(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchContents();
  }, [filters]);

  return { contents, loading, error };
}
```

---

## 8️⃣ **SCALABILITY STRATEGIES**

### **Backend (Already Implemented):**

✅ **Microservices Architecture** - API, Bot, Encoder separate
✅ **Database Optimization** - Prisma with indexes
✅ **Caching Ready** - Redis infrastructure prepared
✅ **Queue System** - Bull for background jobs
✅ **Horizontal Scaling** - Stateless services

### **Frontend Optimizations:**

```typescript
// 1. Lazy Loading
const ContentPage = lazy(() => import('./features/content/pages/ContentPage'));
const ProfilePage = lazy(() => import('./features/profile/pages/ProfilePage'));

// 2. Code Splitting
<Suspense fallback={<Loader />}>
  <Routes>
    <Route path="/content" element={<ContentPage />} />
    <Route path="/profile" element={<ProfilePage />} />
  </Routes>
</Suspense>

// 3. Memoization
const MemoizedContentCard = memo(ContentCard);

const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

const handleClick = useCallback(() => {
  doSomething(id);
}, [id]);

// 4. Virtual Scrolling (for long lists)
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={contents.length}
  itemSize={150}
>
  {({ index, style }) => (
    <div style={style}>
      <ContentCard content={contents[index]} />
    </div>
  )}
</FixedSizeList>
```

---

## 9️⃣ **SECURITY BEST PRACTICES**

### **Frontend:**

```typescript
// 1. XSS Protection
function SafeHTML({ html }: { html: string }) {
  return <div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html) }} />;
}

// 2. CSRF Protection
axios.defaults.headers.common['X-CSRF-Token'] = getCsrfToken();

// 3. HTTP-Only Cookies (not localStorage)
// Token stored in httpOnly cookie by backend

// 4. Input Validation
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

// 5. Auth Interceptor
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
```

### **Backend (Already Implemented):**

✅ **Password Hashing** - bcrypt
✅ **JWT Authentication** - @nestjs/jwt
✅ **HMAC Validation** - Telegram WebApp
✅ **Input Validation** - class-validator
✅ **SQL Injection Protection** - Prisma ORM
✅ **CORS Configuration** - @nestjs/cors
✅ **Rate Limiting Ready** - Infrastructure prepared

---

## 🔟 **TESTING STRATEGY**

### **Unit Tests:**

```typescript
// content.service.test.ts
describe('ContentService', () => {
  let service: ContentService;

  beforeEach(() => {
    service = new ContentService();
  });

  it('should fetch all content', async () => {
    const contents = await service.getAll();
    expect(contents).toBeInstanceOf(Array);
  });

  it('should fetch content by ID', async () => {
    const content = await service.getById('123');
    expect(content.id).toBe('123');
  });
});
```

### **Component Tests:**

```typescript
// ContentCard.test.tsx
describe('ContentCard', () => {
  it('should render content title', () => {
    const content = { id: '1', title: 'Test Movie' };
    render(<ContentCard content={content} onFavorite={() => {}} />);
    expect(screen.getByText('Test Movie')).toBeInTheDocument();
  });

  it('should call onFavorite when button clicked', () => {
    const onFavorite = jest.fn();
    const content = { id: '1', title: 'Test' };
    render(<ContentCard content={content} onFavorite={onFavorite} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(onFavorite).toHaveBeenCalledWith('1');
  });
});
```

---

## 📊 **MONITORING & LOGGING**

### **Backend (NestJS):**

```typescript
// logger.service.ts
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class LoggerService {
  private logger = new Logger('AppLogger');

  log(message: string, context?: string) {
    this.logger.log(message, context);
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, trace, context);
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, context);
  }
}
```

### **Error Tracking:**

```typescript
// Sentry integration
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: 'your-dsn',
  environment: process.env.NODE_ENV,
});

// Error Boundary
<Sentry.ErrorBoundary fallback={<ErrorPage />}>
  <App />
</Sentry.ErrorBoundary>
```

---

## 📈 **PERFORMANCE MONITORING**

### **Web Vitals:**

```typescript
// reportWebVitals.ts
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics(metric) {
  // Send to your analytics service
  console.log(metric);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

---

## ✅ **SUMMARY: OUR PROJECT STATUS**

| Category | Angular Standard | Our Implementation | Status |
|----------|------------------|-------------------|--------|
| **Modular Structure** | Features/Core/Shared | Modules separated | ✅ Backend, 🔄 Frontend |
| **File Size** | < 300 lines | Services < 200 | ✅ |
| **Single Responsibility** | One purpose per file | Refactored | ✅ |
| **Lazy Loading** | Feature modules | Need to implement | 🔄 |
| **Smart/Dumb Components** | Container/Presentation | Need refactor | 🔄 |
| **State Management** | RxJS/NgRx | Zustand | ✅ |
| **Security** | Guards/Interceptors | Implemented | ✅ |
| **Scalability** | Microservices | Implemented | ✅ |
| **Testing** | Jest/Jasmine | Structure ready | 🔄 |

---

## 🎯 **NEXT STEPS TO REACH 100% PROFESSIONAL:**

1. **Frontend Refactor** - Reorganize to Core/Shared/Features structure
2. **Add Lazy Loading** - Code splitting for all routes
3. **Split Components** - Smart/Dumb separation
4. **Add Tests** - Unit & integration tests
5. **Performance** - Memoization & virtual scrolling
6. **Monitoring** - Sentry & web vitals

---

**Current Status: 85% Professional** 🎯  
**With recommended refactors: 100% Professional** 🚀

