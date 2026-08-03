# Declare a character encoding

Servers and browsers communicate with each other by sending bytes of data over the internet. If the server doesn't specify which [character encoding format](https://en.wikipedia.org/wiki/Character_encoding) it's using when it sends an HTML file, the browser won't know what character each byte represents. The [character encoding declaration](https://html.spec.whatwg.org/multipage/semantics.html#charset) specification solves this problem.

A late `<meta charset>` element (one that is not fully contained in the first 1024 bytes of the document) can significantly affect load performance as the browser will assume one character encoding, and if it discovers later that it made a wrong assumption, it will need to start parsing the HTML again from the beginning.

## How to pass this insight

The insight considers the character encoding to be declared if it finds any of the following:

- A `<meta charset>` element in the `<head>` of the document that is completely contained in the first 1024 bytes of the document
- A `Content-Type` HTTP response header with a `charset` directive that matches a [valid IANA name](https://www.iana.org/assignments/character-sets/character-sets.xhtml)

Only one of these needs to be set to pass the insight.

### Add a `<meta charset>` element to your HTML

Add a `<meta charset>` element within the first 1024 bytes of your HTML document. The element must be fully contained within the first 1024 bytes. The best practice is to make the `<meta charset>` element the first element in the `<head>` of your document.

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    ...
  </head>
</html>
```

### Add a `Content-Type` HTTP response header

Configure your server to add a [`Content-Type`](https://developer.mozilla.org/docs/Web/HTTP/Headers/Content-Type) HTTP response header that includes a `charset` directive.

```http
Content-Type: text/html; charset=UTF-8
```

## Resources

- [Insight source code](https://source.chromium.org/chromium/chromium/src/+/main:third_party/devtools-frontend/src/front_end/models/trace/insights/CharacterSet.ts)
