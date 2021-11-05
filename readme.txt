=== WebGL Shader ===
Contributors:      zebranorth
Donate link:       https://paypal.me/zebranorth
Tags:              block, shader, shadertoy, webgl, webgl2, opengl, graphics
Requires at least: 5.8.0
Tested up to:      5.8.0
Stable tag:        1.0.2
Requires PHP:      7.0
License:           GPLv3
License URI:       https://www.gnu.org/licenses/gpl-3.0.en.html

Display a WebGL shader.

== Description ==

This plugin allows you to display a WebGL2 fragment shader, compatible with https://shadertoy.com

Simply copy and paste the code of your fragment shader into the edit box.

This plugin makes use of the open source "gl-matrix" library by Brandon Jones and Colin MacKensie IV.

Your shader code should look like this:

void mainImage( out vec4 fragColor, in vec2 fragCoord )
{
    // Normalized pixel coordinates (from 0 to 1)
    vec2 uv = fragCoord/iResolution.xy;


    // Output to screen as (r, g, b, alpha).
    fragColor = vec4(uv.x, uv.y, 0.0, 1.0);
}

== Installation ==

1. Upload the plugin files to the `/wp-content/plugins/display-webgl-shader` directory, or install the plugin through the WordPress plugins screen directly.
1. Activate the plugin through the 'Plugins' screen in WordPress

== Screenshots ==

1. A shader in action.

== Changelog ==

= 1.0.2 =

Rename from "WebGL Shader" to "Display WebGL Shader".

= 1.0.1 =
* Minor updates so the plugin can be hosted on wordpress.org.

= 1.0.0 =
* Release
