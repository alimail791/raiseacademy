=== YNeet NEET Widgets ===
Contributors: alimail791
Tags: neet, education, quiz, coaching, school
Requires at least: 5.0
Tested up to: 7.1
Requires PHP: 7.0
Stable tag: 1.1.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Free NEET widgets for coaching centre and school websites: daily NEET question, college predictor, MBBS cutoffs, chapter weightage and PYQs.

== Description ==

Give NEET aspirants on your website something useful, free and always up to date:

* **NEET countdown** – days left to NEET with a target for this week.
* **NEET Question of the Day** – a new question every day with answer and explanation.
* **NEET College Predictor** – students enter their rank, category and state and see the MBBS/BDS colleges they can get.
* **Government MBBS cutoffs** – closing ranks for All India Quota or your state.
* **Chapter-wise weightage** – the chapters that carry the most questions in Physics, Chemistry and Biology.
* **Chapter PYQs** – 5 previous-year NEET questions from a chapter you choose, new every day. Class 6–10 Science chapters too.

Set your institute's name once under Settings → YNeet Widgets and every box shows "Shared by <your institute>".

No account, no cost, no ads.

= External service =

The widgets are loaded in an iframe from https://www.yneet.in (YNeet). When a visitor views a page with a widget, their browser loads it from yneet.in. Each widget includes a small "by YNeet" credit link. Terms: https://www.yneet.in/terms Privacy: https://www.yneet.in/privacy

== Installation ==

1. Upload the plugin zip under Plugins → Add New → Upload Plugin and activate it.
2. Optional: Settings → YNeet Widgets → enter your institute name.
3. Add a Shortcode block with one of:
   `[yneet_widget type="qotd"]`
   `[yneet_widget type="countdown"]`
   `[yneet_widget type="predictor"]`
   `[yneet_widget type="cutoff" state="tamil-nadu"]`
   `[yneet_widget type="weightage" subject="Biology"]`
   `[yneet_widget type="pyq" chapter="biology/human-reproduction"]`

== Frequently Asked Questions ==

= Is it free? =
Yes, completely.

= Where do I find chapter ids for the PYQ widget? =
Pick a chapter at https://www.yneet.in/neet-question-widget#pyq and copy the chapter value from the code shown.

== Changelog ==

= 1.1.0 =
* New NEET countdown widget.

= 1.0.0 =
* First release: 5 widgets and the "Shared by" setting.
