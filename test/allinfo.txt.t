---
parent: "?"
---

pages:
  {%- for path in pages() %}
  {%- set page = path | value %}
  - path: "{{ path }}"
    parent: "{{ page.parent | default("") }}"
    title: "{{ page.title | default("") }}"
    description: "{{ page.description | default("") }}"
  {%- endfor %}
