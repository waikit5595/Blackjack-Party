# 免费上线版 Multiplayer Blackjack（Next.js + Firebase RTDB + Vercel API）

这是给你的**免费上线版**架构：

- 前端：Next.js
- 实时同步：Firebase Realtime Database
- 登录：Firebase Authentication（匿名登录）
- 后端逻辑：**Vercel / Next.js Route Handlers**
- 部署：Vercel
- 代码仓库：GitHub

## 为什么这版不需要 Firebase Functions
这版把原本 Firebase Cloud Functions 的逻辑，改成了 Next.js 的服务端 API 路由（Route Handlers）。
这样你就不用为了部署 Firebase Functions 去升级 Blaze。

# 一、你现在要做的事

## 1. 安装前端依赖
项目根目录运行：

```bash
npm install
```

## 2. 建立 `.env.local`
在项目根目录新建 `.env.local`，填入：

```env
# ===== Client side =====
NEXT_PUBLIC_FIREBASE_API_KEY=你的 Firebase apiKey
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=你的项目.firebaseapp.com
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://你的项目-default-rtdb.asia-southeast1.firebasedatabase.app
NEXT_PUBLIC_FIREBASE_PROJECT_ID=你的项目ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=你的项目.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=你的 sender id
NEXT_PUBLIC_FIREBASE_APP_ID=你的 app id

# ===== Server side (Admin SDK) =====
FIREBASE_PROJECT_ID=你的项目ID
FIREBASE_CLIENT_EMAIL=你的 service account client_email
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n你的 private key 内容\n-----END PRIVATE KEY-----\n"
FIREBASE_DATABASE_URL=https://你的项目-default-rtdb.asia-southeast1.firebasedatabase.app
```

# 二、最重要：如何拿到 service account

打开 Firebase Console 对应项目  
→ Project settings  
→ Service accounts  
→ Generate new private key

会下载一个 JSON 文件。

你需要从 JSON 里复制这三个值：

- `project_id`
- `client_email`
- `private_key`

然后填进 `.env.local`：

- `FIREBASE_PROJECT_ID=project_id`
- `FIREBASE_CLIENT_EMAIL=client_email`
- `FIREBASE_PRIVATE_KEY="private_key"`

## 注意 private key
`private_key` 必须保留 `\n`，并且整串放在双引号里。

# 三、Firebase Console 还要开启什么

## 1. 开启匿名登录
Authentication  
→ Sign-in method  
→ Anonymous  
→ Enable

## 2. 创建 Realtime Database
Build  
→ Realtime Database  
→ Create Database  
→ 选 Singapore / asia-southeast1  
→ 建议先用 Locked mode

# 四、Database Rules

这个项目附带了 `database.rules.json`。  
部署规则：

```bash
npm install -g firebase-tools
firebase login
firebase use --add
firebase deploy --only database
```

# 五、本地启动

```bash
npm run dev
```

打开：

```text
http://localhost:3000
```

# 六、部署到 Vercel

## 1. 推到 GitHub
```bash
git init
git add .
git commit -m "free vercel blackjack"
git branch -M main
git remote add origin 你的 GitHub 仓库地址
git push -u origin main
```

## 2. 在 Vercel 导入项目
- New Project
- Import Git Repository
- 选择这个 repo

## 3. 在 Vercel 填环境变量
把 `.env.local` 里的所有变量都填到：
Project Settings → Environment Variables

特别是：
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_DATABASE_URL`

## 4. 部署
点 Deploy 即可。
