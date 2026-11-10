import { useSelect } from '@wordpress/data';
import { STORE_NAME } from '../../store/constants';
import LayoutList from './LayoutList';
import LayoutEditor from './LayoutEditor';
import './editor.scss';

/**
 * Per-Product Layouts header tab: the list of layouts, or the editor of the
 * layout open in the store (`layoutEditor.target`), with the same split view
 * as the Global Settings page.
 */
const PerProductLayoutPage = () => {
	const isEditing = useSelect(
		( select ) => null !== select( STORE_NAME ).getLayoutTarget(),
		[]
	);

	return isEditing ? <LayoutEditor /> : <LayoutList />;
};

export default PerProductLayoutPage;
