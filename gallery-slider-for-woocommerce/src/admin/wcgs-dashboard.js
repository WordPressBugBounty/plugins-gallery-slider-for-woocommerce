import { createRoot } from '@wordpress/element';
import Render from './Render';
import './dashboard.scss';
import './store';

window.addEventListener( 'DOMContentLoaded', () => {
	const element = document.getElementById( 'wcgs-admin-dashboard-wrapper' );
	if ( ! element ) {
		return;
	}
	// The bundle depends on react-jsx-runtime (WP 6.6+), so createRoot is always available.
	createRoot( element ).render( <Render /> );
} );
