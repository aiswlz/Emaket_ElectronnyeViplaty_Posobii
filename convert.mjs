import sharp from 'sharp';

sharp('public/VectorEmaket.png')
  .flatten({ background: { r: 168, g: 213, b: 186 } })
  .negate({ alpha: false })
  .toFile('public/VectorEmaket_new.png')
  .then(() => console.log('Done!'));