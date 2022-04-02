
# 🔥Homura: A general-purpose static site generator

**Homura** is the Japanese word for *fire* but also a (yet another) general-purpose static site generator, highly inspired by [Jekyll](https://jekyllrb.com/) and [Lume](https://lume.land/).

Features:

- Smart server mode for testing.

---

## Quick start

To make your first page, create the Nunjucks file `index.html.t`:

```html
---
title: Welcome!
username: James
---
<html>
  <head>
    <title>{{ title }}</title>
  </head>
  <body>
    <h1>{{ title }}</h1>
    Hello {{ username }}.
  </body>
</html>
```

Start a server:

```
deno run -A homura.ts
```

Then, your page can be found in <http://localhost:8000/>.

Or build it:

```
deno run -A homura.ts build
```

This command will generate your html file in the directory `_site`.

---

## License

MIT License.
See [LICENSE](LICENSE) for details.
