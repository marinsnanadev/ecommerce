import redSuit from './assets/clothing/suits/red-suit (1).jpg';
import brownSkirt from './assets/clothing/skirts/brown-skirt (2).jpg';
import greenPurse from './assets/clothing/purses/green-purse.jpg';
import whiteSuit from './assets/clothing/suits/white-suit (1).jpg';
import whiteSkirt from './assets/clothing/skirts/white-skirt (2).jpg';
import whitePurse from './assets/clothing/purses/white-purse.jpg';
import blackDress from './assets/clothing/dresses/black-dress.jpg';
import redBlouse from './assets/clothing/blouses/red-blouse (2).jpg';
import yellowJacket from './assets/clothing/jackets/yellow-jacket (2).jpg';
import blackPants from './assets/clothing/pants/black-pants (2).jpg';
import glassesImage from './assets/clothing/glasses/glasses.jpg';

export { blackDress, whiteSuit };

export const collections = [
  { index: '01', title: 'Suits', blurb: 'Architectural lines with a rebellious soul.', image: redSuit },
  { index: '02', title: 'Skirts', blurb: 'Fluid structure for evening glamour.', image: brownSkirt },
  { index: '03', title: 'Purses', blurb: 'Statement accessories with a cinematic finish.', image: greenPurse },
  { index: '04', title: 'Dresses', blurb: 'Tailored silhouettes made for evening movement.', image: blackDress },
  { index: '05', title: 'Blouses', blurb: 'Refined detail with an effortless edge.', image: redBlouse },
  { index: '06', title: 'Jackets', blurb: 'Sharp structure for polished layering.', image: yellowJacket },
  { index: '07', title: 'Pants', blurb: 'Clean lines with a fluid, modern drape.', image: blackPants },
  { index: '08', title: 'Glasses', blurb: 'Refined frames that sharpen every look.', image: glassesImage },
];

export const featuredProducts = [
  { id: 'white-suit', index: '01', name: 'White Suit', price: '$180', category: 'Suits', image: whiteSuit },
  { id: 'white-skirt', index: '02', name: 'White Skirt', price: '$130', category: 'Skirts', image: whiteSkirt },
  { id: 'white-purse', index: '03', name: 'White Purse', price: '$130', category: 'Purses', image: whitePurse },
];

export const chunkCollections = (items, size) => {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};