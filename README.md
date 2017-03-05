# Close Unmodified

For when you've just made a commit and you want to quickly close any files that are no longer modified.

Currently the API doesn't really support this sort of thing, so this is basically a nasty hack based on a suggestion by [Eric Amodio](https://github.com/eamodio) in a vscode [issue](https://github.com/Microsoft/vscode/issues/15178).

It runs through your current open editors and closes any that are unmodified in git. This obviously depends on having git installed.

Doesn't cope very well if only one file is currently open. It will also fail if it comes across an opened image. For some reason, the API doesn't provide any way to detect when this has happened. Any suggestions gratefully received!

## Operation

Adds an explorer context menu entry '__Close unmodified editors'__, or you can bind a key to '_extension.closeUnmodifiedEditors_'...

## Installing

You can install the latest version of the extension via the Visual Studio Marketplace [here](https://marketplace.visualstudio.com/items?itemName=Gruntfuggly.closeunmodified).

Alternatively, open Visual Studio code, press `Ctrl+P` or `Cmd+P` and type:

    > ext install closeunmodified

### Source Code

The source code is available on GitHub [here](https://github.com/Gruntfuggly/closeunmodified).
