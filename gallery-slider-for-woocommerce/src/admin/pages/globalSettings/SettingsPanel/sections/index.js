import General from './General';
import Slider from './Slider';
import NavPag from './NavPag';
import ThumbsNav from './ThumbsNav';
import ProductImage from './ProductImage';
import Zoom from './Zoom';
import Video from './Video';
import Lightbox from './Lightbox';
import ShopVideo from './ShopVideo';
import './editor.scss';

/**
 * Settings body of each panel section, keyed like `constants/sections.js`
 * (`section` or `section/sub-section`).
 */
export const SECTION_BODIES = {
	general: General,
	'gallery/slider': Slider,
	'gallery/navpag': NavPag,
	'gallery/thumbsnav': ThumbsNav,
	'gallery/productimage': ProductImage,
	'gallery/zoom': Zoom,
	'gallery/video': Video,
	lightbox: Lightbox,
	shopvideo: ShopVideo,
};
