<?php
/**
 * Plugin Name:       Raise Academy Medical Exam Widgets
 * Description:       Free medical entrance exam widgets for coaching centre and school websites: exam countdown, MCQ of the day, college predictor, government MBBS cutoffs, chapter-wise weightage and daily chapter PYQs. Use the [memcw_widget] shortcode.
 * Version:           1.4.0
 * Requires at least: 5.0
 * Requires PHP:      7.0
 * Author:            Raise Academy
 * Author URI:        https://www.yneet.in
 * License:           GPLv2 or later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       raise-academy-medical-exam-widgets
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'MEMCW_SERVICE_URL', 'https://www.yneet.in' );

/**
 * [memcw_widget type="qotd|countdown|predictor|cutoff|weightage|pyq" state="tamil-nadu" subject="Biology" chapter="biology/human-reproduction" class="" by="Your Institute"]
 *
 * by       Optional. Shows "Shared by <name>" in the box. Defaults to the plugin setting.
 * state    For type="cutoff": all-india-quota, tamil-nadu, kerala, karnataka, ... (default all-india-quota)
 * subject  For type="weightage": Biology, Physics or Chemistry (default Biology)
 * chapter  For type="pyq": the chapter id listed on the service's widget page, or "mixed" (the default) for 6 PYQs a day across all subjects
 * class    For type="pyq": 6 to 10 for school Science chapters; leave empty for medical entrance chapters
 *
 * @param array|string $atts Shortcode attributes.
 * @return string Widget HTML.
 */
function memcw_widget_shortcode( $atts ) {
	$a = shortcode_atts(
		array(
			'type'    => 'qotd',
			'state'   => 'all-india-quota',
			'subject' => 'Biology',
			'chapter' => '',
			'class'   => '',
			'by'      => get_option( 'memcw_by', '' ),
		),
		$atts,
		'memcw_widget'
	);

	$type  = sanitize_key( $a['type'] );
	$base  = MEMCW_SERVICE_URL;
	$query = array();

	switch ( $type ) {
		case 'countdown':
			$path        = '/embed/countdown';
			$height      = 400;
			$title       = __( 'Medical entrance exam countdown', 'raise-academy-medical-exam-widgets' );
			$credit_url  = $base . '/neet-2027-exam-date';
			$credit_text = __( 'Exam countdown', 'raise-academy-medical-exam-widgets' );
			break;
		case 'predictor':
			$path        = '/embed/predictor';
			$height      = 480;
			$title       = __( 'Medical college predictor', 'raise-academy-medical-exam-widgets' );
			$credit_url  = $base . '/neet-college-predictor';
			$credit_text = __( 'College predictor', 'raise-academy-medical-exam-widgets' );
			break;
		case 'cutoff':
			$state          = preg_replace( '/[^a-z-]/', '', strtolower( (string) $a['state'] ) );
			$state          = $state ? $state : 'all-india-quota';
			$path           = '/embed/cutoff';
			$query['state'] = $state;
			$height         = 680;
			$title          = __( 'Government MBBS cutoffs', 'raise-academy-medical-exam-widgets' );
			$credit_url     = $base . '/neet-cutoff/' . $state;
			$credit_text    = __( 'MBBS cutoffs', 'raise-academy-medical-exam-widgets' );
			break;
		case 'weightage':
			$subject          = in_array( $a['subject'], array( 'Biology', 'Physics', 'Chemistry' ), true ) ? $a['subject'] : 'Biology';
			$path             = '/embed/weightage';
			$query['subject'] = $subject;
			$height           = 600;
			$title            = __( 'Chapter-wise weightage', 'raise-academy-medical-exam-widgets' );
			$credit_url       = $base . '/neet-chapter-wise-weightage';
			/* translators: %s: subject name (Biology, Physics or Chemistry). */
			$credit_text      = sprintf( __( '%s chapter-wise weightage', 'raise-academy-medical-exam-widgets' ), $subject );
			break;
		case 'pyq':
			$chapter = preg_replace( '/[^a-z0-9\/-]/', '', strtolower( (string) $a['chapter'] ) );
			$class   = absint( $a['class'] );
			$path    = '/embed/pyq';
			if ( ! $chapter || ( 'mixed' === $chapter && ! ( $class >= 6 && $class <= 10 ) ) ) {
				$chapter    = 'mixed';
				$class      = 0;
				$credit_url = $base . '/neet-practice';
			} elseif ( $class >= 6 && $class <= 10 ) {
				$query['class'] = $class;
				$credit_url     = $base . '/class-' . $class . '-questions#' . $chapter;
			} else {
				$credit_url = $base . '/neet-practice/' . $chapter;
			}
			$query['chapter'] = $chapter;
			$height           = 640;
			$title            = __( 'Chapter-wise previous year questions', 'raise-academy-medical-exam-widgets' );
			$credit_text      = __( 'Chapter-wise PYQs', 'raise-academy-medical-exam-widgets' );
			break;
		default:
			$path        = '/embed/qotd';
			$height      = 560;
			$title       = __( 'MCQ of the day', 'raise-academy-medical-exam-widgets' );
			$credit_url  = $base . '/neet-question-of-the-day';
			$credit_text = __( 'Daily MCQ', 'raise-academy-medical-exam-widgets' );
	}

	$by = trim( sanitize_text_field( (string) $a['by'] ) );
	if ( '' !== $by ) {
		$query['by'] = mb_substr( $by, 0, 60 );
	}
	$src = $base . $path . ( $query ? '?' . http_build_query( $query, '', '&', PHP_QUERY_RFC3986 ) : '' );

	return sprintf(
		'<div class="memcw-widget"><iframe src="%1$s" title="%2$s" width="100%%" height="%3$d" style="border:0;max-width:460px;width:100%%" loading="lazy"></iframe><p style="font-size:13px;margin:4px 0 0"><a href="%4$s">%5$s</a> %6$s <a href="%7$s">yneet.in</a></p></div>',
		esc_url( $src ),
		esc_attr( $title ),
		(int) $height,
		esc_url( $credit_url ),
		esc_html( $credit_text ),
		esc_html__( 'by', 'raise-academy-medical-exam-widgets' ),
		esc_url( $base )
	);
}
add_shortcode( 'memcw_widget', 'memcw_widget_shortcode' );

/**
 * Registers the institute name setting shown as "Shared by ..." in every widget.
 */
function memcw_settings_init() {
	register_setting(
		'memcw_settings',
		'memcw_by',
		array(
			'type'              => 'string',
			'sanitize_callback' => 'sanitize_text_field',
			'default'           => '',
		)
	);
}
add_action( 'admin_init', 'memcw_settings_init' );

/**
 * Adds Settings → Raise Academy Widgets.
 */
function memcw_menu() {
	add_options_page(
		__( 'Raise Academy Medical Exam Widgets', 'raise-academy-medical-exam-widgets' ),
		__( 'Raise Academy Widgets', 'raise-academy-medical-exam-widgets' ),
		'manage_options',
		'raise-academy-medical-exam-widgets',
		'memcw_settings_page'
	);
}
add_action( 'admin_menu', 'memcw_menu' );

/**
 * Renders the settings page.
 */
function memcw_settings_page() {
	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}
	?>
	<div class="wrap">
		<h1><?php esc_html_e( 'Raise Academy Medical Exam Widgets', 'raise-academy-medical-exam-widgets' ); ?></h1>
		<form method="post" action="options.php">
			<?php settings_fields( 'memcw_settings' ); ?>
			<table class="form-table" role="presentation">
				<tr>
					<th scope="row"><label for="memcw_by"><?php esc_html_e( 'Your institute or school name', 'raise-academy-medical-exam-widgets' ); ?></label></th>
					<td>
						<input name="memcw_by" id="memcw_by" type="text" class="regular-text" maxlength="60" value="<?php echo esc_attr( get_option( 'memcw_by', '' ) ); ?>" />
						<p class="description"><?php esc_html_e( 'Shown as "Shared by …" at the top of every widget. Leave empty to hide.', 'raise-academy-medical-exam-widgets' ); ?></p>
					</td>
				</tr>
			</table>
			<?php submit_button(); ?>
		</form>
		<h2><?php esc_html_e( 'Shortcodes', 'raise-academy-medical-exam-widgets' ); ?></h2>
		<p><?php esc_html_e( 'Add a Shortcode block (or paste into any page, post or sidebar text widget):', 'raise-academy-medical-exam-widgets' ); ?></p>
		<ul style="list-style:disc;margin-left:20px">
			<li><code>[memcw_widget type="countdown"]</code> <?php esc_html_e( 'Days left to the exam, with a weekly target', 'raise-academy-medical-exam-widgets' ); ?></li>
			<li><code>[memcw_widget type="qotd"]</code> <?php esc_html_e( 'MCQ of the day', 'raise-academy-medical-exam-widgets' ); ?></li>
			<li><code>[memcw_widget type="predictor"]</code> <?php esc_html_e( 'Medical college predictor', 'raise-academy-medical-exam-widgets' ); ?></li>
			<li><code>[memcw_widget type="cutoff" state="tamil-nadu"]</code> <?php esc_html_e( 'Government MBBS cutoffs (all-india-quota, kerala, karnataka, …)', 'raise-academy-medical-exam-widgets' ); ?></li>
			<li><code>[memcw_widget type="weightage" subject="Biology"]</code> <?php esc_html_e( 'Chapter-wise weightage', 'raise-academy-medical-exam-widgets' ); ?></li>
			<li><code>[memcw_widget type="pyq"]</code> <?php esc_html_e( '6 daily PYQs across Physics, Chemistry and Biology.', 'raise-academy-medical-exam-widgets' ); ?></li>
			<li><code>[memcw_widget type="pyq" chapter="…"]</code> <?php esc_html_e( '5 daily PYQs from one chapter. Pick the chapter on', 'raise-academy-medical-exam-widgets' ); ?> <a href="<?php echo esc_url( MEMCW_SERVICE_URL . '/neet-question-widget#pyq' ); ?>" target="_blank" rel="noopener">yneet.in</a>.</li>
		</ul>
	</div>
	<?php
}
