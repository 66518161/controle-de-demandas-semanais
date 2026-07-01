---
name: layout
description: Padrões de design, layout, cores e diretrizes de estilo CSS para a aplicação de demandas semanais.
---

# Guia de Layout, Estilo e Design System

Este documento define os padrões visuais, tokens CSS, componentes, cores e regras de estilo do sistema web **Controle de Demandas Semanais**. Todo novo campo, tela ou componente deve seguir rigorosamente este guia.

---

## 🎨 1. Paleta de Cores (Tokens CSS Reais)

Os tokens estão definidos em `src/main.css` como variáveis CSS usadas via Tailwind. **Nunca use cores hardcoded** — sempre use os tokens abaixo.

### Cor Primária
- **Primary**: `hsl(19, 82%, 62%)` → Laranja corporativo `#ed824f`
- **Secondary**: `hsl(19, 60%, 55%)` → Laranja escuro `#d17145`
- **Ring / Focus**: Mesmo tom do primary

### Superfícies (Light / Dark)
| Token | Light | Dark |
|---|---|---|
| `background` | `hsl(0 0% 98%)` | `hsl(0 0% 16%)` → `#292929` |
| `card` | `hsl(0 0% 100%)` | `hsl(0 0% 23%)` → `#3a3a3a` |
| `popover` | `hsl(0 0% 100%)` | `hsl(0 0% 20%)` |
| `border` | `hsl(0 0% 90%)` | `hsl(0 0% 26%)` |
| `muted` | `hsl(0 0% 92%)` | `hsl(0 0% 30%)` |
| `muted-foreground` | `hsl(0 0% 40%)` | `hsl(0 0% 83%)` |
| `input` | `hsl(0 0% 90%)` | `hsl(0 0% 28%)` |

### Cores de Status Semântico
Definidas como variáveis e mapeadas em `src/lib/status-config.ts`:

| Status | Token | Classe Badge |
|---|---|---|
| Não Iniciado | `muted` / `muted-foreground` | `bg-muted text-muted-foreground border-border` |
| Em Andamento | `--color-warning` HSL 45 93% 47% | `bg-warning/15 text-warning-foreground border-warning/30` |
| Aguardando | `--color-danger` HSL 0 84% 60% | `bg-danger/15 text-danger-foreground border-danger/30` |
| Concluído | `--color-success` HSL 142 76% 36% | `bg-success/15 text-success-foreground border-success/30` |
| Cancelado | `--color-inactive` HSL 0 0% 40% | `bg-inactive/15 text-inactive-foreground border-inactive/30` |

### Cores de Cargo (Roles)
Definidas em `src/pages/Admin.tsx`, usadas em Badges:
```tsx
const ROLE_COLORS: Record<Role, string> = {
  analyst:  'bg-blue-500/15 text-blue-500 border-blue-500/30',
  manager:  'bg-orange-500/15 text-orange-500 border-orange-500/30',
  director: 'bg-purple-500/15 text-purple-500 border-purple-500/30',
  admin:    'bg-emerald-500/15 text-emerald-500 border-emerald-500/30',
}
```

### Prioridade de Demandas
```tsx
const priorityConfig = {
  low:    { label: 'Baixa',  color: 'text-slate-500' },
  medium: { label: 'Média',  color: 'text-orange-500' },
  high:   { label: 'Alta',   color: 'text-red-500' },
}
```

---

## ✏️ 2. Tipografia

- **Fonte**: `Inter` (Google Fonts) — importada em `src/main.css`
- **Base**: `body { @apply font-sans antialiased; }`
- **Hierarquia de títulos**:
  - `h1` de página: `text-2xl font-bold tracking-tight`
  - Subtítulo de página: `text-muted-foreground` (parágrafo simples)
  - Títulos de card: `CardTitle className="text-lg"`
  - Texto de label em card: `text-sm font-medium`
  - Texto secundário: `text-xs text-muted-foreground`
  - Texto terciário: `text-[10px] text-muted-foreground/70`

---

## 📐 3. Layout e Estrutura de Páginas

### Container Padrão de Página
```tsx
<div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
  <div>
    <h1 className="text-2xl font-bold tracking-tight">Título da Página</h1>
    <p className="text-muted-foreground">Descrição da página.</p>
  </div>
  {/* conteúdo */}
</div>
```
- Páginas de conteúdo amplo usam `max-w-6xl`
- Páginas de formulário/admin usam `max-w-4xl`
- Use sempre `space-y-6` para espaçamento vertical entre seções

### Grid de Estatísticas
```tsx
<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
  <StatCard title="Total" value={n} icon={IconName} />
</div>
```

### Header Fixo
```tsx
<header className="sticky top-0 z-40 w-full glass h-16 flex items-center justify-between px-4 lg:px-8">
```
A classe `.glass` aplica: `bg-background/80 backdrop-blur-md border-b border-border`

### Sidebar de Navegação
```tsx
<aside className="hidden md:flex flex-col w-64 border-r bg-card min-h-[calc(100vh-4rem)] p-4 transition-width duration-300">
```

---

## 🃏 4. Componentes Padrão

### Card (container genérico)
```tsx
<Card className="p-4 flex items-center gap-4">
  {/* conteúdo */}
</Card>
```
- Card interativo (demanda): `hover:shadow-md transition-all hover:border-primary/40 border-border/60 group`
- Card de lista (scroll): `max-h-[calc(100vh-22rem)] overflow-y-auto custom-scrollbar pr-1`

### Card de Estatística (StatCard)
```tsx
<Card>
  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
    <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
    <Icon className="h-4 w-4 text-muted-foreground" />
  </CardHeader>
  <CardContent>
    <div className="text-2xl font-bold">{value}</div>
    {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
  </CardContent>
</Card>
```

### Badge de Status
Sempre use `STATUS_CONFIG` de `src/lib/status-config.ts`:
```tsx
import { STATUS_CONFIG } from '@/lib/status-config'
const cfg = STATUS_CONFIG[demand.status]
<Badge className={cn('font-medium border', cfg.badgeClass)} variant="secondary">
  <span className="mr-1">{cfg.emoji}</span>{cfg.label}
</Badge>
```

### Avatar com Fallback Padrão
Quando o usuário não tem foto, usa `/usuario.png` da pasta `public`:
```tsx
<Avatar className="w-10 h-10">
  <AvatarImage src={user.avatarUrl || '/usuario.png'} />
  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
</Avatar>
```

### Botão Primário
```tsx
<Button className="gap-2">
  <Plus className="w-4 h-4" /> Nova Ação
</Button>
```
- Botão de ação flutuante no header: `className="hidden sm:flex gap-2 rounded-full shadow-subtle hover:scale-105 transition-transform"`
- Botão ícone: `<Button size="icon" variant="ghost">` com ícone `w-4 h-4`
- Botão destrutivo: `<Button size="icon" variant="ghost"><Trash2 className="text-destructive" /></Button>`

### Link de Item de Lista (hover state)
```tsx
<Link
  to="/path"
  className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
>
```

### Tabs
```tsx
<Tabs defaultValue="tab1">
  <TabsList>
    <TabsTrigger value="tab1">
      <Icon className="w-4 h-4 mr-2" /> Label
    </TabsTrigger>
  </TabsList>
  <TabsContent value="tab1" className="space-y-4 mt-4">
    {/* conteúdo */}
  </TabsContent>
</Tabs>
```

---

## ✨ 5. Efeitos e Micro-animações

- **Fade de entrada de página**: `animate-fade-in` (aplicar ao container raiz de cada página)
- **Hover em card interativo**: `hover:shadow-md transition-all hover:border-primary/40`
- **Hover em links de lista**: `hover:bg-muted/50 transition-colors`
- **Botão de ação no header**: `hover:scale-105 transition-transform`
- **Texto do card no hover**: `group-hover:text-primary transition-colors`
- **Glassmorphism no header/modal**: `.glass` → `backdrop-blur-md bg-background/80`
- **Transição padrão**: `transition-colors` ou `transition-all`
- **Border-radius global**: `--radius: 0.75rem`

---

## 📜 6. Scrollbar Customizada

Para áreas de scroll com lista longa, use a classe utilitária:
```tsx
className="overflow-y-auto custom-scrollbar"
```
Ela aplica scrollbar fina (6px) com cor adaptativa para dark e light mode, definida em `src/main.css`.

---

## 💬 7. Formatação de Mensagens no Microsoft Teams

As mensagens enviadas pelo bot seguem uma formatação limpa e profissional:

1. **Cabeçalho**: Títulos claros com separadores `---` ou `###`.
2. **Destaque Visual**: **negrito** para nomes e datas; *itálico* para status.
3. **Listas**: Marcadores `-` para listar demandas individualmente.
4. **Alertas**: `⚠️ ALERTA DE IMPEDIMENTO` para impedimentos críticos.

---

## 🗂️ 8. Convenções de Arquivo e Organização

- `src/pages/` — Páginas completas com layout de container
- `src/components/layout/` — Header, Navigation, Layout shell
- `src/components/dashboard/` — StatCard, ProductivityChart
- `src/components/demands/` — DemandCard, DemandComments
- `src/components/admin/` — UserForm, HierarchyManager
- `src/lib/status-config.ts` — Única fonte de verdade para cores e labels de status
- `src/lib/types.ts` — Tipos TypeScript centralizados (`User`, `Demand`, `Role`, `Status`)
- `src/stores/use-app-store.ts` — Store Zustand global; toda lógica de dados passa por aqui
- `server/src/controllers/` — Lógica de negócio do backend Express/Prisma
- `server/src/routes/` — Registro das rotas de API
- `server/src/services/` — Serviços externos (LLM, etc.)
