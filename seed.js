const db = require('./models/db');
const bcrypt = require('bcryptjs');

async function seedData() {
  try {
    // Tạo bảng tours
    await db.query(`
      CREATE TABLE IF NOT EXISTS tours (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255),
        description TEXT,
        price DECIMAL(10,2),
        date DATE,
        image_url VARCHAR(255),
        duration VARCHAR(255),
        accommodation VARCHAR(255),
        transportation VARCHAR(255),
        food_facilities VARCHAR(255),
        reviews INT,
        UNIQUE (title, date)
      )
    `);

    // Tạo bảng destinations
    await db.query(`
      CREATE TABLE IF NOT EXISTS destinations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100),
        tours_count INT,
        places_count INT,
        image_url VARCHAR(255),
        UNIQUE (name)
      )
    `);

    // Tạo bảng reviews
    await db.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100),
        location VARCHAR(100),
        avatar_url VARCHAR(255),
        content TEXT
      )
    `);

    // Tạo bảng blog_posts
    await db.query(`
      CREATE TABLE IF NOT EXISTS blog_posts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL, 
        excerpt TEXT,                     
        content TEXT NOT NULL,          
        image_url VARCHAR(255),           
        published_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tạo bảng destination_bookings
    await db.query(`
      CREATE TABLE IF NOT EXISTS destination_bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        destination_id INT,
        name VARCHAR(100),
        phone VARCHAR(20),
        guest_count INT,
        travel_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (destination_id) REFERENCES destinations(id)
      )
    `);

    // Tạo bảng tour_bookings
    await db.query(`
      CREATE TABLE IF NOT EXISTS tour_bookings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tour_id INT,
        name VARCHAR(100),
        email VARCHAR(100),
        phone VARCHAR(20),
        guest_count INT,
        transportation VARCHAR(100),
        accommodation VARCHAR(100),
        food_facilities VARCHAR(100),
        travel_date DATE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (tour_id) REFERENCES tours(id)
      )
    `);

    // Tạo bảng subscribers
    await db.query(`
      CREATE TABLE IF NOT EXISTS subscribers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NOT NULL UNIQUE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tạo bảng users (admin)
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'user') DEFAULT 'user',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Mã hóa mật khẩu admin
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Thêm tài khoản admin
    await db.query(`
      INSERT IGNORE INTO users (username, password, role)
      VALUES ('admin', '${hashedPassword}', 'admin')
    `);

    // Seed dữ liệu tours
    await db.query(`
      INSERT IGNORE INTO tours (title, description, price, date, image_url, duration, accommodation, transportation, food_facilities, reviews)
      VALUES 
        ('Tour Hà Giang', 'Khám phá vùng núi phía Bắc với ruộng bậc thang và bản làng người H’Mông.', 199.99, '2025-05-01', 'https://my-triply-website.s3.ap-southeast-1.amazonaws.com/ha-giang.jpg', '5 days 6 nights', '5 star accommodation', 'Bus, Train', 'Meals included', 2544),
        ('Tour Hội An', 'Trải nghiệm phố cổ, ẩm thực miền Trung và đèn lồng rực rỡ.', 179.99, '2025-06-15', 'https://my-triply-website.s3.ap-southeast-1.amazonaws.com/hoi-an.webp', '4 days 3 nights', '4 star accommodation', 'Bus', 'Meals included', 1324),
        ('Tour Phú Quốc', 'Biển xanh, cát trắng, resort sang trọng tại đảo ngọc Việt Nam.', 229.99, '2025-07-10', 'https://my-triply-website.s3.ap-southeast-1.amazonaws.com/phu-quoc.jpg', '6 days 5 nights', '5 star accommodation', 'Flight, Bus', 'Breakfast included', 1894),
        ('Tour Nha Trang', 'Tắm biển, lặn ngắm san hô và vui chơi VinWonders.', 189.99, '2025-08-01', 'https://my-triply-website.s3.ap-southeast-1.amazonaws.com/nha-trang.jpg', '4 days 3 nights', '4 star accommodation', 'Bus', 'Half-board meals', 2147),
        ('Tour Ninh Bình', 'Khám phá Tràng An, Tam Cốc Bích Động và cố đô Hoa Lư.', 169.99, '2025-09-05', 'https://my-triply-website.s3.ap-southeast-1.amazonaws.com/ninh-binh.jpg', '3 days 2 nights', '3 star accommodation', 'Bus, Boat', 'Breakfast included', 1123),
        ('Tour Thanh Hóa', 'Tận hưởng biển Sầm Sơn và đặc sản miền Trung Bắc.', 149.99, '2025-10-12', 'https://my-triply-website.s3.ap-southeast-1.amazonaws.com/thanh-hoa.jpg', '4 days 3 nights', '4 star accommodation', 'Bus', 'Full board meals', 945)
    `);

    // Seed dữ liệu destinations
    await db.query(`
      INSERT IGNORE INTO destinations (name, tours_count, places_count, image_url)
      VALUES 
        ('Vịnh Hạ Long', 10, 6, 'https://my-triply-website.s3.ap-southeast-1.amazonaws.com/Destinations/vinh-ha-long.jpg'),
        ('Mộc Châu', 7, 5, 'https://my-triply-website.s3.ap-southeast-1.amazonaws.com/Destinations/moc-chau.jpg'),
        ('Nghệ An', 5, 4, 'https://my-triply-website.s3.ap-southeast-1.amazonaws.com/Destinations/nghe-an.jpg'),
        ('Cố đô Huế', 9, 7, 'https://my-triply-website.s3.ap-southeast-1.amazonaws.com/Destinations/hue.jpg'),
        ('Tây Ninh', 4, 3, 'https://my-triply-website.s3.ap-southeast-1.amazonaws.com/Destinations/tay-ninh.jpg'),
        ('Bến Tre', 6, 5, 'https://my-triply-website.s3.ap-southeast-1.amazonaws.com/Destinations/ben-tre.jpg')
    `);

    // Seed dữ liệu reviews
    await db.query(`
      INSERT INTO reviews (name, location, avatar_url, content)
      VALUES 
        ('Kevin Watson', 'London, England', 'https://my-triply-website.s3.ap-southeast-1.amazonaws.com/Client/testimonial2.jpg', 'Traveling with this agency was a fantastic experience! Everything was well-organized and exceeded my expectations.'),
        ('Emma Brown', 'New York, USA', 'https://my-triply-website.s3.ap-southeast-1.amazonaws.com/Client/testimonial1.jpg', 'Amazing service and unforgettable memories! Highly recommend this travel agency.'),
        ('Nguyễn Văn An', 'Hà Nội, Việt Nam', 'https://my-triply-website.s3.ap-southeast-1.amazonaws.com/Client/testimonial2.jpg', 'Chuyến đi rất tuyệt vời, hướng dẫn viên thân thiện, dịch vụ chu đáo.'),
        ('Lê Thị Hoa', 'Đà Nẵng, Việt Nam', 'https://my-triply-website.s3.ap-southeast-1.amazonaws.com/Client/testimonial1.jpg', 'Tôi rất hài lòng về lịch trình và chất lượng dịch vụ.')
    `);

    // Seed dữ liệu Blog
    await db.query(`
      INSERT IGNORE INTO blog_posts (title, slug, excerpt, content, image_url, published_date)
      VALUES
        ('Đà Lạt – Thành phố mộng mơ giữa cao nguyên', 'da-lat',
         'Khí hậu mát mẻ, kiến trúc Pháp và thiên nhiên tuyệt đẹp tại Đà Lạt.',
         'Đà Lạt nổi bật với khí hậu mát mẻ quanh năm, kiến trúc Pháp cổ kính và những cảnh quan thiên nhiên tuyệt đẹp. Thành phố này từng là điểm nghỉ dưỡng ưa thích của người Pháp vào thế kỷ 20. Du khách có thể tham quan nhà ga cổ, chợ trung tâm hiện đại, hoặc khám phá di sản kiến trúc độc đáo.',
         'https://my-triply-website.s3.ap-southeast-1.amazonaws.com/Blog/da-lat.jpg', '2025-05-02'),
    
        ('TP. Hồ Chí Minh – Năng động và đa sắc màu', 'ho-chi-minh',
         'Thành phố hiện đại hòa quyện với lịch sử và ẩm thực phong phú.',
         'TP. Hồ Chí Minh là trung tâm kinh tế và văn hóa sôi động của Việt Nam. Kết hợp giữa kiến trúc thuộc địa Pháp và hiện đại như Landmark 81, nơi đây còn nổi bật với ẩm thực đường phố và đời sống về đêm náo nhiệt.',
         'https://my-triply-website.s3.ap-southeast-1.amazonaws.com/Blog/ho-chi-minh.jpg', '2025-05-02'),
    
        ('Phú Quốc – Thiên đường nghỉ dưỡng nhiệt đới', 'phu-quoc',
         'Hòn đảo lớn nhất Việt Nam với biển xanh và rừng nguyên sinh.',
         'Phú Quốc nổi tiếng với bãi biển cát trắng, nước trong xanh và hệ sinh thái đa dạng. Du khách có thể lặn biển, khám phá rừng quốc gia hoặc tìm hiểu lịch sử tại nhà tù Phú Quốc.',
         'https://my-triply-website.s3.ap-southeast-1.amazonaws.com/Blog/dao-phu-quoc.jpg', '2025-05-02')
    `);

    console.log('Tạo bảng và chèn dữ liệu mẫu thành công!');
    process.exit();
  } catch (err) {
    console.error('Lỗi khi seed dữ liệu:', err.message);
    process.exit(1);
  }
}

seedData();
