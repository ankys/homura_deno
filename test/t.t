
path: {{ path }}
size: {{ info.size }}
mtime: {{ info.mtime }}

files: {{ files() }}
pages: {{ pages() }}
info: {{ pages() | info | mtime | locale_date("en-US", "date") }}
