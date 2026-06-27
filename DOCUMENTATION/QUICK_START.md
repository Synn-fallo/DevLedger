# DevLedger - Quick Start Guide

**⏱️ 5 minutes to running DevLedger**

---

## Step 1: Prerequisites ✓

Make sure you have:
- Node.js 18+ installed
- npm or yarn
- A Supabase account (free: https://supabase.com)

Check Node version:
```bash
node --version  # Should be v18.0.0 or higher
npm --version   # Should be 8.0.0 or higher
```

---

## Step 2: Clone & Install (1 min)

```bash
# Navigate to project directory
cd /tmp/cc-agent/64238102/project

# Install dependencies
npm install
```

---

## Step 3: Configure Supabase (2 min)

### Get Your Credentials
1. Go to https://supabase.com
2. Create new project (or use existing)
3. Go to Settings → API
4. Copy:
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`

### Create .env File
```bash
echo "VITE_SUPABASE_URL=https://your-project.supabase.co" > .env
echo "VITE_SUPABASE_ANON_KEY=your-anon-key-here" >> .env
```

### Set Up Database Schema

**Option A: SQL Editor (Easiest)**
1. In Supabase Dashboard
2. Go to SQL Editor
3. Create new query
4. Copy entire content of `DATABASE_MIGRATION_SCHEMA.sql`
5. Execute query
6. Wait for success message

**Option B: Command Line**
```bash
# Install PostgreSQL client first
# macOS: brew install postgresql
# Ubuntu: sudo apt install postgresql-client

psql "postgresql://[user]:[password]@[host]:[port]/postgres" \
  -f DATABASE_MIGRATION_SCHEMA.sql
```

---

## Step 4: Run Development Server (1 min)

```bash
npm run dev
```

Output should show:
```
  VITE v5.4.8  ready in 123 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

Open http://localhost:5173 in your browser ✓

---

## Step 5: Create Test Account (1 min)

1. Click "Inscription" (Signup tab)
2. Enter test credentials:
   - Email: `test@example.com`
   - Password: `Test1234` (min 6 chars)
3. Click "S'inscrire"
4. You'll be logged in automatically

---

## 🎯 First Actions to Try

### 1. Toggle Dark/Light Mode
- Click menu icon (top left) on mobile, or look at sidebar
- Click "Mode Clair" / "Mode Sombre" button

### 2. Go to Settings
- Click "Paramètres" in sidebar
- Try different settings:
  - Set hourly rate: 5000 XOF
  - Set token price: 0.00001
  - Try simple/advanced modes

### 3. Create a Project
- Click "Projets" in sidebar
- Click "Créer un projet"
- Fill in:
  - **Nom**: "Mon Premier Projet"
  - **Description**: "My first DevLedger project"
- Click "Créer"

### 4. Add a Session
- Click on the project you created
- Click "Ajouter une session"
- Fill in:
  - **Date**: Today
  - **Temps Bolt.new**: 30
  - **Temps ChatGPT**: 45
  - **Tokens consommés**: 5000
  - **Déploiement**: "Déployé avec succès"
- Click "Ajouter"

### 5. Check Dashboard
- Click "Dashboard" in sidebar
- See your calculated project value!

---

## 📊 Key Features Quick Tour

| Feature | Location | Purpose |
|---------|----------|---------|
| **Dashboard** | Sidebar | View KPIs and metrics |
| **Projects** | Sidebar | Manage all projects |
| **Timeline** | Sidebar | View activity chronologically |
| **Analytics** | Sidebar | Advanced metrics & charts |
| **Export** | Sidebar | Download data as PDF/CSV |
| **Settings** | Sidebar | Configure rates & preferences |
| **Profile** | Sidebar | View account info |
| **Theme** | Sidebar bottom | Toggle dark/light mode |
| **Logout** | Sidebar bottom | Sign out |

---

## 🔧 Common Tasks

### Change Theme
Sidebar → Click "Mode Clair" or "Mode Sombre"

### Set Your Rates
Sidebar → Paramètres → Tab "Tarification"
- Set hourly rate (e.g., 5000)
- Set token price (e.g., 0.00001)

### Create Project
Sidebar → Projets → "Créer un projet"

### Log Work Session
Open Project → "Ajouter une session"

### View Analytics
Sidebar → Analytics → Choose period

### Export Data
Sidebar → Export → Choose format (PDF/CSV/Excel)

---

## ✅ Troubleshooting

### Issue: "Missing Supabase environment variables"
**Solution**:
- Check `.env` file has correct values
- Restart dev server: `npm run dev`
- Clear browser cache

### Issue: "Cannot read property 'uid' of null"
**Solution**:
- You're not logged in
- Go to Auth page
- Create test account or login

### Issue: "RLS policy preventing access"
**Solution**:
- Database schema not fully applied
- Rerun `DATABASE_MIGRATION_SCHEMA.sql`
- Make sure NO errors in execution

### Issue: "Blank page"
**Solution**:
- Open browser DevTools (F12)
- Check Console for errors
- Make sure Supabase credentials are correct

---

## 📱 Mobile Testing

### Test Responsive Design
1. Open DevTools (F12)
2. Click device toggle (mobile icon)
3. Select device or custom size
4. Test navigation and forms

### Test on Real Device
```bash
# Get your machine IP
ipconfig getifaddr en0  # macOS
hostname -I            # Linux

# Run on that IP
npm run dev -- --host 0.0.0.0

# Access from phone on same network
# http://<your-ip>:5173
```

---

## 🚀 Production Build

When ready to deploy:

```bash
# Build for production
npm run build

# Output will be in ./dist directory

# Test production build locally
npm run preview
```

Then deploy to:
- **Vercel**: `vercel deploy`
- **Netlify**: `netlify deploy`
- **GitHub Pages**: Configure in package.json

---

## 📚 Next Steps

After quick start:

1. **Read Full Docs**
   - `README_DEVLEDGER.md` - Complete overview
   - `DEVELOPMENT_CHECKPOINT.md` - Current status
   - `MIGRATION_GUIDE.md` - Database details

2. **Explore Code**
   - Check `src/pages/` for page implementations
   - Review `src/contexts/` for state management
   - See `src/components/` for reusable components

3. **Test Features**
   - Create multiple projects
   - Add sessions with different tools
   - Check calculations in dashboard
   - Export data

4. **Customize**
   - Adjust colors in `tailwind.config.js`
   - Add your branding
   - Modify default values
   - Add custom features

---

## 🆘 Need Help?

### Check These Files First
1. `README_DEVLEDGER.md` - Feature overview
2. `DEVELOPMENT_CHECKPOINT.md` - Status & architecture
3. `MIGRATION_GUIDE.md` - Database schema details

### Common Questions

**Q: Where is my data stored?**
A: Supabase PostgreSQL database in the cloud

**Q: Is my data secure?**
A: Yes! RLS policies ensure only you can access your data

**Q: Can I export my data?**
A: Yes! Export page offers PDF, CSV, and Excel formats

**Q: Can I share projects with others?**
A: Not in v1.0, planned for future team features

**Q: How is project value calculated?**
A: `(Time/60 × Hourly Rate) + (Tokens × Token Price)`

---

## ⚡ Pro Tips

1. **Use Dark Mode** - Better for long dev sessions
2. **Set Accurate Rates** - For correct value calculations
3. **Log Sessions Daily** - Easier than catching up
4. **Review Analytics** - Discover productivity patterns
5. **Export Monthly** - Keep backup of your data

---

## 🎓 Learning Path

### Beginner (Today)
- [ ] Setup & first run
- [ ] Create test project
- [ ] Add sample session
- [ ] Toggle theme

### Intermediate (Tomorrow)
- [ ] Read full README
- [ ] Understand database schema
- [ ] Explore all pages
- [ ] Test all features

### Advanced (This Week)
- [ ] Review source code
- [ ] Understand architecture
- [ ] Deploy to production
- [ ] Customize for your needs

---

## 📞 Quick Support

**Issue?** Check this order:
1. ✓ This file (QUICK_START.md)
2. ✓ README_DEVLEDGER.md
3. ✓ DEVELOPMENT_CHECKPOINT.md
4. ✓ Browser console (F12)
5. ✓ Supabase logs

---

## 🎉 You're Ready!

You now have a fully functional DevLedger instance running locally. Start exploring and enjoy!

---

**Happy coding! 🚀**

*DevLedger - Where Productivity Meets Precision*

---

**Last Updated**: 2026-03-05
**Status**: Ready to use
**Time to setup**: ~5 minutes
