const express = require('express');
const app = express();
const path = require('path');
const db = require('./models/db'); // Kết nối RDS
const Review = require('./models/Review');
const pool = require('./models/db'); 

const Tour = require('./models/Tour');
const Destination = require('./models/Destination');
const session = require('express-session');
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // Dành cho form với data từ method POST

require('dotenv').config(); // Đọc file .env
// app.use('/tours', tourRoutes);

// Thêm express.urlencoded middleware:
app.use(express.urlencoded({ extended: true })); // middleware để đọc req.body

// Cấu hình thư mục tĩnh
app.use(express.static(path.join(__dirname, 'public')));

// Cấu hình view engine (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Route kiểm tra kết nối RDS
app.get('/test-db', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    res.send('Kết nối DB thành công: ' + JSON.stringify(rows));
  } catch (err) {
    res.status(500).send('Lỗi kết nối DB: ' + err.message);
  }
});

// Cấu hình session
app.use(session({
  secret: 'Alice1711*', 
  resave: false, 
  saveUninitialized: true
}));

// app.use(flash());

// ===================== QUẢN TRỊ ADMIN ===================== //
// Trang Login Admin
app.get('/admin/login', (req, res) => {
  res.render('admin/login', { error: null });
});

// Kiểm tra xem có phải là Admin chưa
function isAdmin(req, res, next) {
  if (req.session.isAdmin) {
    return next();
  }
  res.redirect('/admin/login');
}

// Xử lý Login
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin123') {
    req.session.isAdmin = true;  // Set session variable
    res.redirect('/admin/dashboard');
  } else {
    res.render('admin/login', { error: 'Invalid username or password' });
  }
});


app.get('/admin/dashboard', async (req, res) => {
  try {
    const [tours] = await db.query('SELECT * FROM tours');
    const [destinations] = await db.query('SELECT * FROM destinations');
    const [blogs] = await db.query('SELECT * FROM blog_posts');

    // JOIN để lấy tên tour từ tour_bookings
    const [tourBookings] = await db.query(`
      SELECT tb.*, t.title AS tour_title
      FROM tour_bookings tb
      JOIN tours t ON tb.tour_id = t.id
    `);

    // JOIN để lấy tên destination từ destination_bookings
    const [destinationBookings] = await db.query(`
      SELECT db.*, d.name AS destination_name
      FROM destination_bookings db
      JOIN destinations d ON db.destination_id = d.id
    `);

    res.render('admin/dashboard', {
      tours,
      destinations,
      blogs,
      tourBookings,
      destinationBookings
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Lỗi server khi lấy dữ liệu dashboard');
  }
});



// Edit Tour
app.get('/admin/edit-tour/:id', async (req, res) => {
  const id = req.params.id;
  const [tour] = await db.query('SELECT * FROM tours WHERE id = ?', [id]);
  if (tour.length === 0) return res.status(404).send('Tour not found');
  res.render('admin/edit-tour', { tour: tour[0] });
});

// Trang Admin (danh sách Tour, Destination, Blog)
app.get('/admin', isAdmin, async (req, res) => {
  // Lấy danh sách Tour, Destination, Blog từ database
  const tours = await db.query('SELECT * FROM tours');
  const destinations = await db.query('SELECT * FROM destinations');
  const blogs = await db.query('SELECT * FROM blog_posts');
  
  res.render('admin/dashboard', { tours, destinations, blogs });
});


// Hiển thị form thêm Tour, không cần kiểm tra admin nữa
app.get('/admin/add-tour', (req, res) => {
  res.render('admin/add-tour');
});

// Add Tour
app.post('/admin/add-tour', async (req, res) => {
  const { title, description, price, date, image_url, duration, accommodation, transportation, food_facilities, reviews } = req.body;

  try {
    await db.query(
      `INSERT INTO tours (title, description, price, date, image_url, duration, accommodation, transportation, food_facilities, reviews)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, price, date, image_url, duration, accommodation, transportation, food_facilities, reviews]
    );
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error adding tour:', error);
    res.status(500).send('Internal Server Error');
  }
});



// Edit Tour
app.post('/admin/edit-tour/:id', async (req, res) => {
  try {
    const { title, description, price, date, image_url, duration, accommodation, transportation, food_facilities, reviews } = req.body;
    const { id } = req.params;

    // Database query for update tour
    await pool.query(
      `UPDATE tours SET title = ?, description = ?, price = ?, date = ?, image_url = ?, duration = ?, accommodation = ?, transportation = ?, food_facilities = ?, reviews = ? WHERE id = ?`,
      [title, description, price, date, image_url, duration, accommodation, transportation, food_facilities, reviews, id]
    );

    res.redirect('/admin/dashboard');  // Redirect after success
  } catch (error) {
    console.error('Error updating tour:', error);  // Log the error for debugging
    res.status(500).send('Internal Server Error');
  }
});

// Delete Tour
app.post('/admin/delete-tour/:id', async (req, res) => {
  try {
    await db.query(`DELETE FROM tours WHERE id = ?`, [req.params.id]);
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error deleting tour:', error);
    res.status(500).send('Internal Server Error');
  }
});


// Add destination
app.get('/admin/add-des', (req, res) => {
  res.render('admin/add-des', {
      messages: req.session.messages || {}
  });
  // Xóa messages sau khi render nếu bạn dùng flash-like logic
  req.session.messages = null;
});

app.post('/admin/add-des', async (req, res) => {
  const { name, tours_count, places_count, image_url } = req.body;

  try {
    await db.query(
      'INSERT INTO destinations (name, tours_count, places_count, image_url) VALUES (?, ?, ?, ?)',
      [name, tours_count, places_count, image_url]
    );
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error adding destination:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.post('/admin/delete-des/:id', async (req, res) => {
  try {
    await db.query(`DELETE FROM destinations WHERE id = ?`, [req.params.id]);
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error deleting destination:', error);
    res.status(500).send('Internal Server Error');
  }
});



// Edit Des
// GET Edit Destination Form
app.get('/admin/edit-des/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM destinations WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).send('Destination not found');
    res.render('admin/edit-des', { destination: rows[0] });
  } catch (error) {
    console.error('Error fetching destination:', error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/admin/edit-des/:id', async (req, res) => {
  const { id } = req.params;
  const { name, tours_count, places_count, image_url } = req.body;

  try {
    await db.query(
      `UPDATE destinations SET name = ?, tours_count = ?, places_count = ?, image_url = ? WHERE id = ?`,
      [name, tours_count, places_count, image_url, id]
    );

    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error updating destination:', error);
    res.status(500).send('Internal Server Error');
  }
});


// Delete Des
app.post('/admin/delete-des/:id', (req, res) => {
  const sql = `DELETE FROM destinations WHERE id = ?`;
  db.query(sql, [req.params.id], (err, result) => {
    if (err) {
      console.error('Error deleting destination:', err);
      return res.status(500).send('Error deleting destination');
    }
    res.json({ success: true, message: 'Destination deleted successfully' });
    res.redirect('/admin/dashboard');
  });
});


// Add blog
app.get('/admin/add-blog', (req, res) => {
  res.render('admin/add-blog');
});
app.post('/admin/add-blog', async (req, res) => {
  const { title, slug, excerpt, content, image_url } = req.body;

  try {
    await db.query(
      `INSERT INTO blog_posts (title, slug, excerpt, content, image_url)
       VALUES (?, ?, ?, ?, ?)`,
      [title, slug, excerpt, content, image_url]
    );
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error adding blog:', error);
    res.status(500).send('Internal Server Error');
  }
});


// Edit Blog
// GET Edit Blog Form
app.get('/admin/edit-blog/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM blog_posts WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).send('Blog post not found');
    res.render('admin/edit-blog', { blog: rows[0] });
  } catch (error) {
    console.error('Error fetching blog post:', error);
    res.status(500).send('Internal Server Error');
  }
});


// POST Edit Blog
app.post('/admin/edit-blog/:id', async (req, res) => {
  const { id } = req.params;
  const { title, slug, excerpt, content, image_url } = req.body;

  try {
    await db.query(
      `UPDATE blog_posts SET title = ?, slug = ?, excerpt = ?, content = ?, image_url = ? WHERE id = ?`,
      [title, slug, excerpt, content, image_url, id]
    );

    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).send('Internal Server Error');
  }
});


// Delete Blog
app.post('/admin/delete-blog/:id', async (req, res) => {
  try {
    await db.query(`DELETE FROM blog_posts WHERE id = ?`, [req.params.id]);
    res.redirect('/admin/dashboard');
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).send('Internal Server Error');
  }
});




// ===================== WEBSITE ===================== //
// Route cho trang giới thiệu
app.get('/about', (req, res) => {
  res.render('about');  // Trang giới thiệu
});



// GET: Lấy danh sách tour titles và render trang tìm kiếm
app.get('/search', async (req, res) => {
  try {
    const { title, price, page = 1 } = req.query;
    const pageSize = 4;
    const offset = (page - 1) * pageSize;

    const [allTitles] = await db.execute('SELECT DISTINCT title FROM tours');
    const [priceRange] = await db.execute('SELECT MIN(price) AS minPrice, MAX(price) AS maxPrice FROM tours');

    const minPrice = priceRange[0].minPrice;
    const maxPrice = priceRange[0].maxPrice;

    let baseSql = 'FROM tours WHERE 1=1';
    const params = [];

    if (title) {
      baseSql += ' AND title LIKE ?';
      params.push(`%${title}%`);
    }

    if (price) {
      const priceVal = parseFloat(price);
      if (priceVal > maxPrice) {
        baseSql += ' AND price > ?';
        params.push(maxPrice);
      } else {
        baseSql += ' AND price <= ?';
        params.push(priceVal);
      }
    }

    const [countRows] = await db.execute(`SELECT COUNT(*) as count ${baseSql}`, params);
    const totalResults = countRows[0].count;
    const totalPages = Math.ceil(totalResults / pageSize);

    const [tours] = await db.execute(
      `SELECT * ${baseSql} LIMIT ${pageSize} OFFSET ${offset}`,
      params
    );

    res.render('pages/search-results', {
      tours,
      allTitles,
      minPrice,
      maxPrice,
      title,
      price,
      currentPage: parseInt(page),
      totalPages
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error filtering tours');
  }
});


// Render trang chi tiết địa điểm
app.get('/destination/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query('SELECT * FROM destinations WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).send('Destination not found');
    res.render('pages/about-location', { destination: rows[0] });
  } catch (err) {
    res.status(500).send('Lỗi khi truy xuất điểm đến: ' + err.message);
  }
});

// Route cho trang chủ với tất cả tour
app.get('/', async (req, res) => {
  try {
    // Lấy tất cả tour và các thông tin cần thiết
    const tours = await Tour.getAllTours();
    const destinations = await Destination.getAllDestinations();
    const reviews = await Review.getAllReviews();
    const featuredTour = tours[0]; // Chọn ngẫu nhiên một tour làm nổi bật

    // Lấy danh sách tất cả title tour
    const [allTitles] = await db.execute('SELECT DISTINCT title FROM tours');

    // Lấy min và max giá từ bảng tours
    const [priceRange] = await db.execute('SELECT MIN(price) AS minPrice, MAX(price) AS maxPrice FROM tours');
    const minPrice = priceRange[0].minPrice;
    const maxPrice = priceRange[0].maxPrice;

    // Lấy blog posts từ database
    const [blogs] = await db.query('SELECT * FROM blog_posts ORDER BY published_date DESC LIMIT 3');

    // Lấy giá trị price từ query parameters nếu có
    const price = req.query.price || '';  // Dùng giá trị từ query parameter, nếu không có thì để trống

    // Render trang index và truyền dữ liệu vào
    res.render('index', { 
      tours, 
      featuredTour, 
      reviews, 
      destinations, 
      allTitles,
      minPrice,  // Truyền minPrice vào view
      maxPrice,  // Truyền maxPrice vào view
      price,     // Truyền giá trị price vào view
      blogs      // Truyền blogs vào view
    });
  } catch (err) {
    res.status(500).send('Lỗi khi lấy dữ liệu: ' + err.message);
  }
});

app.get('/tour/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const [rows] = await db.query('SELECT * FROM tours WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).send('Tour not found');
    const tour = rows[0];
    res.render('pages/about-tour', { tour }); // Tạo file about-tour.ejs để hiển thị chi tiết
  } catch (err) {
    res.status(500).send('Lỗi khi truy xuất tour: ' + err.message);
  }
});

app.get('/booking/tour/:id', async (req, res) => {
  const tourId = req.params.id;

  try {
    const tourQuery = `
      SELECT * FROM tours WHERE id = ?;
    `;
    const [tour] = await db.query(tourQuery, [tourId]);

    if (tour.length === 0) {
      return res.status(404).send('Tour not found');
    }

    res.render('about_location', {
      tour: tour[0] // Lấy thông tin tour
    });
  } catch (err) {
    console.error('Error fetching tour:', err.message);
    res.status(500).send('Error fetching tour');
  }
});


// Route book a des trip
app.post('/book-destination', async (req, res) => {
  const { name, phone, guest_count, travel_date, destination_id } = req.body;

  try {
    await db.query(`
      INSERT INTO destination_bookings (destination_id, name, phone, guest_count, travel_date)
      VALUES (?, ?, ?, ?, ?)
    `, [destination_id, name, phone, guest_count, travel_date]);

    res.send('Đặt chỗ thành công! Xin vui lòng chờ nhân viên liên hệ! Chúng tôi xin chân thành cảm ơn quý khách!'); // Trả về thông báo thành công
  } catch (err) {
    console.error('Lỗi khi đặt chỗ:', err.message);
    res.status(500).send('Lỗi khi đặt chỗ!');
  }
});

// Route book a tour
app.post('/book-tour', async (req, res) => {
  const { tour_id, name, email, phone, guest_count, transportation, accommodation, food_facilities, travel_date } = req.body;

  try {
    await db.query(`
      INSERT INTO tour_bookings (tour_id, name, email, phone, guest_count, transportation, accommodation, food_facilities, travel_date)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [tour_id, name, email, phone, guest_count, transportation, accommodation, food_facilities, travel_date]);

    res.status(200).send('Đặt tour thành công!');
  } catch (err) {
    console.error('Error booking tour:', err.message);
    res.status(500).send('Error booking the tour!');
  }
});

// Route POST /subscribe
app.post('/subscribe', async (req, res) => {
  const { email } = req.body;
  try {
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Email không hợp lệ' });
    }

    await db.query(`INSERT IGNORE INTO subscribers (email) VALUES (?)`, [email]);

    res.status(200).json({ message: 'Subscribed successfully' });
  } catch (err) {
    console.error('Lỗi đăng ký subscriber:', err.message);
    res.status(500).json({ error: 'Đăng ký thất bại' });
  }
});

// Route Blog
app.get('/blog', async (req, res) => {
  const [blogs] = await db.query('SELECT * FROM blog_posts ORDER BY published_date DESC LIMIT 3');
  res.render('pages/blog', { blogs });
});

app.get('/blog/:slug', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM blog_posts WHERE slug = ?', [req.params.slug]);
  if (rows.length === 0) return res.status(404).send('Blog not found');
  res.render('pages/blog-detail', { blog: rows[0] });
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server đang chạy tại http://localhost:${port}`);
});
