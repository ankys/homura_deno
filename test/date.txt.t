
{{ now() }}
{{ mtime }}
{{ mtime | iso_date }}
{{ mtime | utc_date }}
{{ mtime | local_date }}
{{ mtime | local_date("date") }}
{{ mtime | local_date("time") }}
{{ mtime | locale_date }}
{{ mtime | locale_date("ar-EG") }}
{{ mtime | locale_date("ja-JP-u-ca-japanese", "date") }}
{{ mtime | locale_date("en-US", null, { hour12: false }) }}
