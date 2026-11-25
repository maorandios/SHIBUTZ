# עובדים-געש

אפליקציית Progressive Web App בעברית (RTL) לשיבוץ יומי של עובדי בניין לאתרי עבודה.

הנתונים (אתרים / עובדים / שיבוצים) משותפים לכל המשתמשים המורשים ונשמרים ב־**Upstash Redis** דרך Vercel. הכניסה היא עם מספר תעודת זהות מהרשימה המורשית.

## התקנה מקומית

```bash
npm install
cp .env.example .env.local
npm run dev
```

פתחו את [http://localhost:3000](http://localhost:3000).

בלי משתני Upstash, האפליקציה משתמשת באחסון זמני בזיכרון השרת המקומי (מתאפס בריסטארט) — נוח לפיתוח. בפרודקשן חובה Redis.

## משתמשים מורשים

הרשימה נמצאת ב־`lib/allowed-users.ts`. כרגע:

- דידי מוסאי — `301201101`
- מאור כהן — `101201301`

## בנייה ובדיקות

```bash
npm run lint
npm run typecheck
npm run build
```

## פריסה ל־Vercel

1. חברו את הריפו ל־Vercel (Framework: **Next.js**).
2. הוסיפו לโปรיקט **Upstash Redis** מ־Vercel Marketplace / Storage (נוצרים `UPSTASH_REDIS_REST_URL` ו־`UPSTASH_REDIS_REST_TOKEN`).
3. הוסיפו משתנה סביבה `SESSION_SECRET` (מחרוזת ארוכה ואקראית).
4. Deploy מחדש.

## התקנה ל־iPhone (מסך הבית)

1. פתחו את האתר ב־**Safari**.
2. Share → **Add to Home Screen**.
3. אשרו את השם **עובדים-געש**.

## התקנה ל־Android

1. פתחו ב־**Chrome**.
2. Install app / באנר ההתקנה באפליקציה.

## חשוב לדעת

- אחרי התחברות, כל המכשירים רואים ועורכים את אותו מאגר נתונים משותף.
- אם שני אנשים שומרים באותו רגע, אחד יקבל רענון מהשרת (מניעת דריסה שקטה).
- שיתוף לוואטסאפ דורש את אפליקציית WhatsApp.
