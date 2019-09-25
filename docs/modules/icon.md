## Changing your module's icon

In your module's package.json, there's a mandatory `botpress` field. To change the module icon, set the `menuIcon`.

We're using [Google's Metarial Icons](https://material.io/icons/) for the built-in icons. You can change the icon simply by specifying the name, e.g. `card_giftcard`.

You can also set a custom icon, in which case the value needs to be `custom` (case-sensitive) and you must also provide a PNG icon at the root of your module names `icon.png`. It is best if the icon is greyscale or white, so that it fits any theme.

## Changing the text

You can change the text in the menu setting a value for `botpress.menuText` property at your module `package.json` file.
