<?php
/**
 * Plugin Name:       WebGL Shader
 * Description:       Display a WebGL shader
 * Requires at least: 5.8
 * Requires PHP:      7.0
 * Version:           1.0.0
 * Author:            Zebra North
 * License:           Proprietary
 * License URI:
 * Text Domain:       webgl-shader
 *
 * @package           zebra-north
 */

/**
 * Registers the block using the metadata loaded from the `block.json` file.
 * Behind the scenes, it registers also all assets so they can be enqueued
 * through the block editor in the corresponding context.
 *
 * @see https://developer.wordpress.org/block-editor/tutorials/block-tutorial/writing-your-first-block-type/
 */
function zebra_north_webgl_shader_block_init() {
	register_block_type( __DIR__ );
}

/**
 * Load the required Javascript files in response to the "wp_enqueue_scripts" event.
 */
function zebra_north_webgl_shader_enqueue_scripts() {
	wp_enqueue_script('zebra_north_gl_matrix', plugin_dir_url(__FILE__) . '/gl-matrix.js');
	wp_enqueue_script('zebra_north_webgl_shader', plugin_dir_url(__FILE__) . '/webgl-shader.js');
}

add_action( 'init', 'zebra_north_webgl_shader_block_init' );
add_action('wp_enqueue_scripts', 'zebra_north_webgl_shader_enqueue_scripts' );
