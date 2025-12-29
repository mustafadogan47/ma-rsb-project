const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Database setup
const db = new sqlite3.Database('./marbs.db', (err) => {
    if (err) {
        console.error('Database bağlantı hatası:', err);
    } else {
        console.log('SQLite veritabanına bağlandı');
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        user_type TEXT NOT NULL CHECK(user_type IN ('bayi', 'isletme')),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
        if (err) {
            console.error('Tablo oluşturma hatası:', err);
        } else {
            console.log('Users tablosu hazır');
        }
    });

    db.run(`CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        sku TEXT,
        category TEXT,
        stock INTEGER DEFAULT 0,
        price REAL,
        wholesale_price REAL,
        description TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`, (err) => {
        if (err) {
            console.error('Products tablo oluşturma hatası:', err);
        } else {
            console.log('Products tablosu hazır');
        }
    });

    db.run(`CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        customer_name TEXT NOT NULL,
        total_amount REAL DEFAULT 0,
        status TEXT DEFAULT 'Tamamlandı',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users (id)
    )`, (err) => {
        if (err) {
            console.error('Orders tablo oluşturma hatası:', err);
        } else {
            console.log('Orders tablosu hazır');
        }
    });
}

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'marbs-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false, // production'da true yapılmalı (HTTPS gerektirir)
        maxAge: 24 * 60 * 60 * 1000 // 24 saat
    }
}));

// Authentication middleware
function isAuthenticated(req, res, next) {
    if (req.session.user) {
        next();
    } else {
        // HTML sayfaları için redirect, API için JSON döndür
        if (req.path.endsWith('.html') || !req.path.startsWith('/api')) {
            return res.redirect('/');
        }
        res.status(401).json({ success: false, message: 'Lütfen giriş yapın' });
    }
}

// Protected route middleware
function requireUserType(type) {
    return (req, res, next) => {
        if (!req.session.user) {
            return res.redirect('/');
        }
        if (req.session.user.user_type !== type) {
            return res.status(403).send(`<h1>Erişim Engellendi</h1><p>Bu sayfaya erişim yetkiniz yok. <a href="/">Ana Sayfaya Dön</a></p>`);
        }
        next();
    };
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Register endpoint
app.post('/api/register', async (req, res) => {
    const { username, email, password, user_type } = req.body;

    // Validation
    if (!username || !email || !password || !user_type) {
        return res.status(400).json({ success: false, message: 'Tüm alanları doldurun' });
    }

    if (user_type !== 'bayi' && user_type !== 'isletme') {
        return res.status(400).json({ success: false, message: 'Geçersiz kullanıcı türü' });
    }

    try {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user
        db.run(
            'INSERT INTO users (username, email, password, user_type) VALUES (?, ?, ?, ?)',
            [username, email, hashedPassword, user_type],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE')) {
                        return res.status(400).json({ 
                            success: false, 
                            message: 'Bu kullanıcı adı veya email zaten kullanılıyor' 
                        });
                    }
                    return res.status(500).json({ success: false, message: 'Kayıt sırasında hata oluştu' });
                }

                res.json({ 
                    success: true, 
                    message: 'Kayıt başarılı! Giriş yapabilirsiniz.',
                    user_type: user_type
                });
            }
        );
    } catch (error) {
        res.status(500).json({ success: false, message: 'Sunucu hatası' });
    }
});

// Login endpoint
app.post('/api/login', (req, res) => {
    const { username, password, user_type } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Kullanıcı adı ve şifre gerekli' });
    }

    if (!user_type || (user_type !== 'bayi' && user_type !== 'isletme')) {
        return res.status(400).json({ success: false, message: 'Lütfen geçerli bir kullanıcı türü seçin' });
    }

    db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Sunucu hatası' });
        }

        if (!user) {
            return res.status(401).json({ success: false, message: 'Kullanıcı adı veya şifre hatalı' });
        }

        // Kullanıcı türü kontrolü
        if (user.user_type !== user_type) {
            return res.status(401).json({ 
                success: false, 
                message: `Bu hesap ${user.user_type === 'bayi' ? 'Bayi' : 'İşletme'} türündedir. Lütfen doğru kullanıcı türünü seçin.` 
            });
        }

        try {
            const isValidPassword = await bcrypt.compare(password, user.password);

            if (!isValidPassword) {
                return res.status(401).json({ success: false, message: 'Kullanıcı adı veya şifre hatalı' });
            }

            // Set session
            req.session.user = {
                id: user.id,
                username: user.username,
                email: user.email,
                user_type: user.user_type
            };

            // Return redirect URL based on user type
            const redirectUrl = user.user_type === 'bayi' 
                ? '/bayi/yenibyiweb.html' 
                : '/işletme/isletme_ana.html';

            res.json({ 
                success: true, 
                message: 'Giriş başarılı',
                redirectUrl: redirectUrl,
                user_type: user.user_type
            });
        } catch (error) {
            res.status(500).json({ success: false, message: 'Sunucu hatası' });
        }
    });
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Çıkış yapılamadı' });
        }
        res.json({ success: true, message: 'Çıkış başarılı' });
    });
});

// Get current user
app.get('/api/user', isAuthenticated, (req, res) => {
    res.json({ success: true, user: req.session.user });
});

// Ürün ekleme endpoint
app.post('/api/products', isAuthenticated, (req, res) => {
    const { product_name, sku, category, stock, price, wholesale_price, description } = req.body;
    const user_id = req.session.user.id;

    // Validation
    if (!product_name) {
        return res.status(400).json({ success: false, message: 'Ürün adı zorunludur' });
    }

    db.run(
        `INSERT INTO products (user_id, product_name, sku, category, stock, price, wholesale_price, description) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [user_id, product_name, sku, category, stock || 0, price || 0, wholesale_price || 0, description],
        function(err) {
            if (err) {
                console.error('Ürün ekleme hatası:', err);
                return res.status(500).json({ success: false, message: 'Ürün eklenirken hata oluştu' });
            }

            res.json({ 
                success: true, 
                message: 'Ürün başarıyla eklendi',
                product_id: this.lastID
            });
        }
    );
});

// Sipariş ekleme (işletme)
app.post('/api/orders', isAuthenticated, (req, res) => {
    if (req.session.user.user_type !== 'isletme') {
        return res.status(403).json({ success: false, message: 'Bu işlem sadece işletme kullanıcıları içindir' });
    }

    const { customer_name, total_amount, status } = req.body;
    const user_id = req.session.user.id;

    if (!customer_name) {
        return res.status(400).json({ success: false, message: 'Müşteri adı zorunludur' });
    }

    db.run(
        `INSERT INTO orders (user_id, customer_name, total_amount, status)
         VALUES (?, ?, ?, ?)`,
        [user_id, customer_name, total_amount || 0, status || 'Tamamlandı'],
        function(err) {
            if (err) {
                console.error('Sipariş ekleme hatası:', err);
                return res.status(500).json({ success: false, message: 'Sipariş eklenemedi' });
            }

            res.json({
                success: true,
                message: 'Sipariş eklendi',
                order_id: this.lastID
            });
        }
    );
});

// Siparişleri listele (işletme)
app.get('/api/orders', isAuthenticated, (req, res) => {
    if (req.session.user.user_type !== 'isletme') {
        return res.status(403).json({ success: false, message: 'Bu liste sadece işletme kullanıcıları içindir' });
    }

    const user_id = req.session.user.id;
    db.all(
        'SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC',
        [user_id],
        (err, rows) => {
            if (err) {
                console.error('Sipariş listeleme hatası:', err);
                return res.status(500).json({ success: false, message: 'Siparişler getirilemedi' });
            }

            res.json({ success: true, orders: rows });
        }
    );
});

// En sık sipariş veren müşteriler (işletme)
app.get('/api/top-customers', isAuthenticated, (req, res) => {
    if (req.session.user.user_type !== 'isletme') {
        return res.status(403).json({ success: false, message: 'Bu liste sadece işletme kullanıcıları içindir' });
    }

    const user_id = req.session.user.id;

    db.all(
        `SELECT customer_name, COUNT(*) AS order_count, COALESCE(SUM(total_amount), 0) AS total_amount
         FROM orders
         WHERE user_id = ?
         GROUP BY customer_name
         HAVING customer_name IS NOT NULL AND customer_name != ''
         ORDER BY order_count DESC, total_amount DESC
         LIMIT 6`,
        [user_id],
        (err, rows) => {
            if (err) {
                console.error('Top customers hatası:', err);
                return res.status(500).json({ success: false, message: 'Müşteri listesi getirilemedi' });
            }

            res.json({ success: true, customers: rows || [] });
        }
    );
});

// Kullanıcının ürünlerini getir
app.get('/api/products', isAuthenticated, (req, res) => {
    const user_id = req.session.user.id;

    db.all(
        'SELECT * FROM products WHERE user_id = ? ORDER BY created_at DESC',
        [user_id],
        (err, products) => {
            if (err) {
                console.error('Ürün listeleme hatası:', err);
                return res.status(500).json({ success: false, message: 'Ürünler getirilemedi' });
            }

            res.json({ success: true, products: products });
        }
    );
});

// Yapay zeka destekli içgörüler (şu an ürün verileri üzerinden)
app.get('/api/ai-insights', isAuthenticated, (req, res) => {
    if (req.session.user.user_type !== 'isletme') {
        return res.status(403).json({ success: false, message: 'Bu içgörüleri sadece işletme kullanıcıları görebilir' });
    }

    const user_id = req.session.user.id;

    db.all('SELECT * FROM products WHERE user_id = ?', [user_id], (err, products) => {
        if (err) {
            console.error('AI içgörü hatası:', err);
            return res.status(500).json({ success: false, message: 'İçgörüler hesaplanamadı' });
        }

        const safeProducts = products || [];
        const totalProducts = safeProducts.length;
        const totalStock = safeProducts.reduce((sum, p) => sum + (p.stock || 0), 0);
        const totalValue = safeProducts.reduce((sum, p) => sum + ((p.price || 0) * (p.stock || 0)), 0);
        const totalCost = safeProducts.reduce((sum, p) => sum + ((p.wholesale_price || 0) * (p.stock || 0)), 0);
        const avgPrice = totalProducts > 0 ? totalValue / Math.max(totalStock, 1) : 0;
        const avgMargin = totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0;

        // Kategori dağılımı
        const categoryMap = {};
        safeProducts.forEach((p) => {
            const key = p.category || 'Tanımsız';
            categoryMap[key] = (categoryMap[key] || 0) + 1;
        });
        const categories = Object.entries(categoryMap)
            .map(([name, count]) => ({
                name,
                count,
                percentage: totalProducts > 0 ? Math.round((count / totalProducts) * 100) : 0
            }))
            .sort((a, b) => b.count - a.count);

        // Düşük stoklar
        const lowStock = safeProducts
            .filter((p) => (p.stock || 0) <= 5)
            .sort((a, b) => (a.stock || 0) - (b.stock || 0))
            .slice(0, 6)
            .map((p) => ({
                id: p.id,
                product_name: p.product_name,
                stock: p.stock || 0,
                price: p.price || 0
            }));

        // Marj ve fiyat sinyalleri
        const marginSignals = safeProducts
            .map((p) => {
                const cost = p.wholesale_price || 0;
                const price = p.price || 0;
                const marginPct = cost > 0 ? ((price - cost) / cost) * 100 : 0;
                return { name: p.product_name, marginPct, stock: p.stock || 0 };
            })
            .sort((a, b) => a.marginPct - b.marginPct);

        const recommendations = [];

        if (totalProducts === 0) {
            recommendations.push('Henüz ürün eklenmemiş. En az 3 temel ürün ekleyerek stok ve fiyat analizlerini başlatın.');
        } else {
            if (lowStock.length > 0) {
                recommendations.push(`${lowStock.length} üründe kritik stok tespit edildi. Bu ürünleri yeniden sipariş vermeyi önceliklendirin.`);
            }

            if (avgMargin < 12 && totalProducts > 3) {
                recommendations.push('Genel marj düşük görünüyor. En az marjlı ürünlerin fiyatlarını gözden geçirip paket/promosyon ekleyin.');
            }

            const topCategory = categories[0];
            if (topCategory && topCategory.percentage >= 40) {
                recommendations.push(`${topCategory.name} kategorisi ürün portföyünüzün ${topCategory.percentage}%’ini oluşturuyor. Bu kategoride çapraz satış için tamamlayıcı ürün ekleyin.`);
            }

            const weakestMargin = marginSignals[0];
            if (weakestMargin && weakestMargin.marginPct < 8) {
                recommendations.push(`${weakestMargin.name} marjı %${weakestMargin.marginPct.toFixed(1)} ile çok düşük. Fiyatlandırmayı yeniden düşünün veya tedarik maliyetini iyileştirin.`);
            }

            const highestMargin = marginSignals[marginSignals.length - 1];
            if (highestMargin && highestMargin.marginPct > 25) {
                recommendations.push(`${highestMargin.name} yüksek marja sahip. Bu ürünü öne çıkaran kampanyalarla toplam karlılığı artırabilirsiniz.`);
            }
        }

        const response = {
            success: true,
            stats: {
                totalProducts,
                totalStock,
                totalValue,
                avgPrice,
                avgMargin: Number(avgMargin.toFixed(1)),
            },
            categories,
            lowStock,
            marginSignals: marginSignals.slice(0, 5),
            recommendations,
            generatedAt: new Date().toISOString()
        };

        res.json(response);
    });
});

// Ürün silme
app.delete('/api/products/:id', isAuthenticated, (req, res) => {
    const product_id = req.params.id;
    const user_id = req.session.user.id;

    // Ürünün kullanıcıya ait olup olmadığını kontrol et
    db.get(
        'SELECT * FROM products WHERE id = ? AND user_id = ?',
        [product_id, user_id],
        (err, product) => {
            if (err) {
                console.error('Ürün kontrol hatası:', err);
                return res.status(500).json({ success: false, message: 'Sunucu hatası' });
            }

            if (!product) {
                return res.status(404).json({ success: false, message: 'Ürün bulunamadı veya yetkiniz yok' });
            }

            // Ürünü sil
            db.run('DELETE FROM products WHERE id = ?', [product_id], function(err) {
                if (err) {
                    console.error('Ürün silme hatası:', err);
                    return res.status(500).json({ success: false, message: 'Ürün silinemedi' });
                }

                res.json({ success: true, message: 'Ürün başarıyla silindi' });
            });
        }
    );
});

// Ortak sayfalar - hem bayi hem işletme erişebilir (shared klasöründen)
app.get('/shared/MaRSB_hakkimizda.html', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'shared', 'MaRSB_hakkimizda.html'));
});

app.get('/shared/MaRSB_destek.html', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'shared', 'MaRSB_destek.html'));
});

// Geriye dönük uyumluluk için eski URL'ler (bayi klasöründen shared'e yönlendir)
app.get('/bayi/Marsb_Hakkımızda.html', isAuthenticated, (req, res) => {
    res.redirect('/shared/MaRSB_hakkimizda.html');
});

app.get('/bayi/Marsb_destek.html', isAuthenticated, (req, res) => {
    res.redirect('/shared/MaRSB_destek.html');
});

app.get('/bayi/marsb_ayarlar.html', isAuthenticated, (req, res) => {
    res.sendFile(path.join(__dirname, 'bayi', 'marsb_ayarlar.html'));
});

// Shared klasörü için static files
app.use('/shared', isAuthenticated, express.static(path.join(__dirname, 'shared')));

// Protected routes - Bayi klasörü için
app.use('/bayi', requireUserType('bayi'), express.static(path.join(__dirname, 'bayi')));

// Protected routes - İşletme klasörü için
app.use('/işletme', requireUserType('isletme'), express.static(path.join(__dirname, 'işletme')));

// Public static files (scripts, styles, vb.)
app.use(express.static(__dirname, {
    index: false // Otomatik index.html göstermeyi kapat
}));

// Start server
app.listen(PORT, () => {
    console.log(`MaRBS sunucusu http://localhost:${PORT} adresinde çalışıyor`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Veritabanı kapatma hatası:', err);
        }
        console.log('Veritabanı bağlantısı kapatıldı');
        process.exit(0);
    });
});
