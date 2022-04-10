
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

path: {{ path }}
relative: {{ "/index.html" | relative }}
relative: {{ "/index.html" | relative | pathname }}
relative: {{ "/index.html" | relative("/a/") | pathname }}

obj: {{ ({ a: "../b" } | url("http://localhost/a/") ).a }}
