ALTER TABLE communities ADD COLUMN IF NOT EXISTS banner_url text;

UPDATE communities SET banner_url = 'https://images.pexels.com/photos/7723610/pexels-photo-7723610.jpeg?auto=compress&cs=tinysrgb&h=350' WHERE slug = 'AgostoLilas';
UPDATE communities SET banner_url = 'https://images.pexels.com/photos/8107614/pexels-photo-8107614.jpeg?auto=compress&cs=tinysrgb&h=350' WHERE slug = 'Mulheres';
UPDATE communities SET banner_url = 'https://images.pexels.com/photos/30483132/pexels-photo-30483132.jpeg?auto=compress&cs=tinysrgb&h=350' WHERE slug = 'LeiMariaPenha';
UPDATE communities SET banner_url = 'https://images.pexels.com/photos/8436684/pexels-photo-8436684.jpeg?auto=compress&cs=tinysrgb&h=350' WHERE slug = 'SaudeFeminina';
UPDATE communities SET banner_url = 'https://images.pexels.com/photos/37356829/pexels-photo-37356829.jpeg?auto=compress&cs=tinysrgb&h=350' WHERE slug = 'Enfrentamento';
