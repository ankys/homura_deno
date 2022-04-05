
path: {{ path }}
size: {{ info.fsize }}
mtime: {{ info.mtime }}

files: {{ files() }}
pages: {{ pages() }}
info: {{ pages() | info | mtime | locale_date("en-US", "date") }}

files: {{ files("/*.html") }}
files: {{ files("/*.txt") }}
files: {{ files("^/.*.html$") }}
files: {{ files("/a*") }}
pages: {{ pages("/a*") }}
