=== Raise Academy Medical Exam Widgets ===
Contributors: alimail791
Tags: education, quiz, mcq, coaching, school
Requires at least: 5.0
Tested up to: 7.1
Requires PHP: 7.0
Stable tag: 1.3.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Free medical entrance exam widgets for coaching centre and school websites: daily MCQ, college predictor, MBBS cutoffs, chapter weightage and PYQs.

== Description ==

Give medical entrance aspirants on your website something useful, free and always up to date:

* **Exam countdown** – days left to the exam with a target for this week.
* **MCQ of the day** – a new question every day with answer and explanation.
* **College predictor** – students enter their rank, category and state and see the MBBS/BDS colleges they can get.
* **Government MBBS cutoffs** – closing ranks for All India Quota or your state.
* **Chapter-wise weightage** – the chapters that carry the most questions in Physics, Chemistry and Biology.
* **Chapter PYQs** – 5 previous-year questions from a chapter you choose, new every day. Class 6–10 Science chapters too.

The content is aimed at students preparing for Indian medical entrance exams such as NEET-UG. This plugin is not affiliated with or endorsed by the National Testing Agency.

Set your institute's name once under Settings → Raise Academy Widgets and every box shows "Shared by <your institute>".

No account, no cost, no ads.

== External services ==

This plugin embeds content from yneet.in, an education website run by Raise Academy, the plugin author. It is needed to show the questions, countdown, predictor, cutoffs and weightage data, which are kept up to date on that site.

When a visitor views a page that contains one of the widgets, their browser loads it in an iframe from https://www.yneet.in. The request includes the widget type and the shortcode options set by the site owner (state, subject, chapter, class and the optional "Shared by" institute name). Like any web request, the visitor's IP address and browser details are sent to yneet.in. Nothing is sent until a page with a widget is viewed.

* Terms of use: https://www.yneet.in/terms
* Privacy policy: https://www.yneet.in/privacy

== Installation ==

1. Upload the plugin zip under Plugins → Add New → Upload Plugin and activate it.
2. Optional: Settings → Raise Academy Widgets → enter your institute name.
3. Add a Shortcode block with one of:
   `[memcw_widget type="qotd"]`
   `[memcw_widget type="countdown"]`
   `[memcw_widget type="predictor"]`
   `[memcw_widget type="cutoff" state="tamil-nadu"]`
   `[memcw_widget type="weightage" subject="Biology"]`
   `[memcw_widget type="pyq" chapter="biology/human-reproduction"]`

== Frequently Asked Questions ==

= Is it free? =
Yes, completely.

= Where do I find chapter ids for the PYQ widget? =
Pick a chapter at https://www.yneet.in/neet-question-widget#pyq and copy the chapter value from the code shown.

== Changelog ==

= 1.3.0 =
* Renamed to Raise Academy Medical Exam Widgets.

= 1.2.0 =
* Renamed. New shortcode: [memcw_widget].

= 1.1.0 =
* New exam countdown widget.

= 1.0.0 =
* First release: 5 widgets and the "Shared by" setting.
