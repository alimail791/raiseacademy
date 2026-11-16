<?php
/**
 * Plugin Name:       YNeet NEET Widgets
 * Plugin URI:        https://www.yneet.in/neet-question-widget
 * Description:       Free NEET widgets for coaching centre and school websites: NEET countdown, NEET Question of the Day, NEET College Predictor, government MBBS cutoffs, chapter-wise weightage and daily chapter PYQs. Use the [yneet_widget] shortcode.
 * Version:           1.1.0
 * Requires at least: 5.0
 * Requires PHP:      7.0
 * Author:            YNeet
 * Author URI:        https://www.yneet.in
 * License:           GPLv2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       yneet-neet-widgets
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * [yneet_widget type="qotd|countdown|predictor|cutoff|weightage|pyq" state="tamil-nadu" subject="Biology" chapter="biology/human-reproduction" class="" by="Your Institute"]
 *
 * by       Optional. Shows "Shared by <name>" in the box. Defaults to the plugin setting.
 * state    For type="cutoff": all-india-quota, tamil-nadu, kerala, karnataka, ... (default all-india-quota)
 * subject  For type="weightage": Biology, Physics or Chemistry (default Biology)
 * chapter  For type="pyq": the chapter id from https://www.yneet.in/neet-question-widget#pyq
 * class    For type="pyq": 6 to 10 for school Science chapters; leave empty for NEET
 */
function yneet_widget_shortcode( $atts ) {
	$a = shortcode_atts(
		array(
			'type'    => 'qotd',
			'state'   => 'all-india-quota',
			'subject' => 'Biology',
			'chapter' => '',
			'class'   => '',
			'by'      => get_option( 'yneet_widgets_by', '' ),
		),
		$atts,
		'yneet_widget'
	);

	$type  = sanitize_key( $a['type'] );
	$base  = 'https://www.yneet.in';
	$query = array();

	switch ( $type ) {
		case 'countdown':
			$path   = '/embed/countdown';
			$height = 400;
			$title  = 'NEET Countdown';
			$credit = '<a href="' . $base . '/neet-2027-exam-date">NEET 2027 countdown</a>';
			break;
		case 'predictor':
			$path   = '/embed/predictor';
			$height = 480;
			$title  = 'NEET College Predictor';
			$credit = '<a href="' . $base . '/neet-college-predictor">NEET College Predictor</a>';
			break;
		case 'cutoff':
			$state  = preg_replace( '/[^a-z-]/', '', strtolower( $a['state'] ) );
			$state  = $state ? $state : 'all-india-quota';
			$path   = '/embed/cutoff';
			$query['state'] = $state;
			$height = 680;
			$title  = 'NEET Cutoff';
			$credit = '<a href="' . $base . '/neet-cutoff/' . $state . '">NEET cutoff</a>';
			break;
		case 'weightage':
			$subject = in_array( $a['subject'], array( 'Biology', 'Physics', 'Chemistry' ), true ) ? $a['subject'] : 'Biology';
			$path    = '/embed/weightage';
			$query['subject'] = $subject;
			$height  = 600;
			$title   = 'NEET Chapter-wise Weightage';
			$credit  = '<a href="' . $base . '/neet-chapter-wise-weightage">NEET ' . esc_html( $subject ) . ' chapter-wise weightage</a>';
			break;
		case 'pyq':
			$chapter = preg_replace( '/[^a-z0-9\/-]/', '', strtolower( $a['chapter'] ) );
			$class   = absint( $a['class'] );
			if ( ! $chapter ) {
				return '<!-- yneet_widget: type="pyq" needs a chapter, see https://www.yneet.in/neet-question-widget#pyq -->';
			}
			$path = '/embed/pyq';
			if ( $class >= 6 && $class <= 10 ) {
				$query['class'] = $class;
				$page           = $base . '/class-' . $class . '-questions#' . $chapter;
			} else {
				$page = $base . '/neet-practice/' . $chapter;
			}
			$query['chapter'] = $chapter;
			$height = 640;
			$title  = 'NEET chapter PYQs';
			$credit = '<a href="' . esc_url( $page ) . '">Chapter-wise NEET PYQs</a>';
			break;
		default:
			$path   = '/embed/qotd';
			$height = 560;
			$title  = 'NEET Question of the Day';
			$credit = 'Daily <a href="' . $base . '/neet-question-of-the-day">NEET Question of the Day</a>';
	}

	$by = trim( sanitize_text_field( $a['by'] ) );
	if ( '' !== $by ) {
		$query['by'] = mb_substr( $by, 0, 60 );
	}
	$src = $base . $path . ( $query ? '?' . http_build_query( $query, '', '&', PHP_QUERY_RFC3986 ) : '' );

	return sprintf(
		'<div class="yneet-widget"><iframe src="%1$s" title="%2$s" width="100%%" height="%3$d" style="border:0;max-width:460px;width:100%%" loading="lazy"></iframe><p style="font-size:13px;margin:4px 0 0">%4$s by <a href="%5$s">YNeet</a></p></div>',
		esc_url( $src ),
		esc_attr( $title ),
		(int) $height,
		$credit,
		esc_url( $base )
	);
}
add_shortcode( 'yneet_widget', 'yneet_widget_shortcode' );

/* Settings → YNeet Widgets: the institute name shown as "Shared by ..." in every box. */
function yneet_widgets_settings_init() {
	register_setting( 'yneet_widgets', 'yneet_widgets_by', array( 'type' => 'string', 'sanitize_callback' => 'sanitize_text_field', 'default' => '' ) );
}
add_action( 'admin_init', 'yneet_widgets_settings_init' );

function yneet_widgets_menu() {
	add_options_page( 'YNeet Widgets', 'YNeet Widgets', 'manage_options', 'yneet-widgets', 'yneet_widgets_settings_page' );
}
add_action( 'admin_menu', 'yneet_widgets_menu' );

function yneet_widgets_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	?>
	<div class="wrap">
		<h1>YNeet NEET Widgets</h1>
		<form method="post" action="options.php">
			<?php settings_fields( 'yneet_widgets' ); ?>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="yneet_widgets_by">Your institute or school name</label></th>
					<td>
						<input name="yneet_widgets_by" id="yneet_widgets_by" type="text" class="regular-text" maxlength="60" value="<?php echo esc_attr( get_option( 'yneet_widgets_by', '' ) ); ?>" />
						<p class="description">Shown as "Shared by …" at the top of every widget. Leave empty to hide.</p>
					</td>
				</tr>
			</table>
			<?php submit_button(); ?>
		</form>
		<h2>Shortcodes</h2>
		<p>Add a <b>Shortcode</b> block (or paste into any page, post or sidebar text widget):</p>
		<ul style="list-style:disc;margin-left:20px">
			<li><code>[yneet_widget type="countdown"]</code> Days left to NEET, with a weekly target</li>
			<li><code>[yneet_widget type="qotd"]</code> NEET Question of the Day</li>
			<li><code>[yneet_widget type="predictor"]</code> NEET College Predictor</li>
			<li><code>[yneet_widget type="cutoff" state="tamil-nadu"]</code> Government MBBS cutoffs (all-india-quota, kerala, karnataka, …)</li>
			<li><code>[yneet_widget type="weightage" subject="Biology"]</code> Chapter-wise weightage</li>
			<li><code>[yneet_widget type="pyq" chapter="…"]</code> 5 daily PYQs from one chapter. Pick the chapter on <a href="https://www.yneet.in/neet-question-widget#pyq" target="_blank" rel="noopener">yneet.in</a>.</li>
		</ul>
	</div>
	<?php
}
