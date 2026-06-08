# BEME Fullstack Monorepo

一个可扩展的 React 全栈模板：

- 前端：`apps/web`（Vite + React + TypeScript）
- 后端：`apps/api`（Express + TypeScript）
- 共享类型：`packages/shared`
- 多静态路由页面：`/`、`/landing`、`/about`、`/pricing`、`/contact`
- CI/CD：GitHub Actions 自动部署前端到 GitHub Pages

## 本地开发

```bash
npm install
npm run dev:web   # 前端 http://localhost:5173
npm run dev:api   # 后端 http://localhost:8787
```

## 本地构建

```bash
npm run build
```

## 新增静态页面

1. 在 `apps/web/src/pages` 下新建页面组件
2. 在 `apps/web/src/App.tsx` 里新增 `Route`
3. 可选：在导航 `navItems` 里添加入口

## 推送到你的空仓库

```bash
git add .
git commit -m "feat: init scalable react fullstack monorepo with pages c
icd"
git branch -M main
git remote add origin <你的仓库地址>
git push -u origin main
```

## 开启 GitHub Pages

在 GitHub 仓库页面：

1. `Settings` -> `Pages`
2. `Build and deployment` 选择 `GitHub Actions`
3. 等待 `Actions` 中 `Deploy Web to GitHub Pages` 工作流成功
4. 访问 `https://<你的GitHub用户名>.github.io/BEME/`

> 注意：如果你仓库名不是 `BEME`，请修改 `apps/web/vite.config.ts` 中的 `base`。
