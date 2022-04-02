---
parent: "?"
---

pages:
  {%- for path, page in pages() %}
  - path: "{{ path }}"
    parent: "{{ page.parent | default("") }}"
    title: "{{ page.title | default("") }}"
    description: "{{ page.description | default("") }}"
  {%- endfor %}
